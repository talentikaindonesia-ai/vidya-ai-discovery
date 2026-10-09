import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

export interface UserXP {
  current_xp: number;
  current_level: number;
  total_xp_earned: number;
}

export interface UserStreak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export const useGameification = () => {
  const [userXP, setUserXP] = useState<UserXP>({ current_xp: 0, current_level: 1, total_xp_earned: 0 });
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [loading, setLoading] = useState(true);
  // Cache the resolved userId — avoids calling getUser() on every XP/streak action
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadGameificationData();
  }, []);

  const loadGameificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      // Load XP data. maybeSingle (not single) so a missing row returns null
      // instead of throwing — a thrown error here used to fall into the else
      // branch and insert a *new* empty row on every load, which (before the
      // unique constraint) spiralled into dozens of duplicate rows per user.
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('id,user_id,current_xp,current_level,total_xp_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (xpData) {
        setUserXP(xpData);
      } else {
        // Initialize XP for new user
        await initializeUserXP(user.id);
      }

      // Load streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('id,user_id,streak_type,current_streak,longest_streak,last_activity_date')
        .eq('user_id', user.id);

      if (streakData) {
        setStreaks(streakData);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeUserXP = async (userId: string) => {
    try {
      // Race-safe: insert only if missing (unique constraint on user_id).
      // ignoreDuplicates avoids overwriting an existing row's XP with zeros.
      await supabase
        .from('user_xp')
        .upsert(
          { user_id: userId, current_xp: 0, current_level: 1, total_xp_earned: 0 },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );
      const { data } = await supabase
        .from('user_xp')
        .select('id,user_id,current_xp,current_level,total_xp_earned')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setUserXP(data);

      // Initialize basic streaks (idempotent — skip types that already exist)
      const { data: existing } = await supabase
        .from('user_streaks')
        .select('streak_type')
        .eq('user_id', userId);
      const have = new Set((existing ?? []).map(r => r.streak_type));
      const missing = ['login', 'learning', 'achievement'].filter(t => !have.has(t));
      if (missing.length) {
        await supabase
          .from('user_streaks')
          .insert(missing.map(type => ({ user_id: userId, streak_type: type, current_streak: 0, longest_streak: 0 })));
      }
    } catch (error) {
      console.error('Error initializing user XP:', error);
    }
  };

  const awardXP = async (amount: number, reason: string) => {
    try {
      const userId = userIdRef.current;
      if (!userId) return;

      // Use atomic DB RPC — eliminates race condition from read-modify-write
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount:  amount,
        p_reason:  reason,
      });

      if (error) throw error;

      const result = data as {
        awarded?: boolean; current_xp: number; current_level: number;
        leveled_up: boolean; amount: number;
      };

      /* award_xp kini dijaga server: maks 100 XP per klaim dan 500 XP per
         hari dari browser. Bila batas tercapai, server membalas awarded=false
         dan amount=0 — jangan tampilkan "+X XP" yang tidak benar-benar masuk. */
      if (result.awarded === false) {
        return { levelUp: false, newLevel: result.current_level };
      }
      const masuk = result.amount ?? amount;

      setUserXP(prev => ({
        ...prev,
        current_xp:      result.current_xp,
        current_level:   result.current_level,
        total_xp_earned: prev.total_xp_earned + masuk,
      }));

      sonnerToast(`+${masuk} XP`, { description: reason, duration: 3000 });
      if (result.leveled_up) {
        sonnerToast('🎉 Level Up!', {
          description: `Selamat! Kamu mencapai Level ${result.current_level}!`,
          duration: 5000,
        });
      }

      return { levelUp: result.leveled_up, newLevel: result.current_level };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return null;
    }
  };

  const updateStreak = async (streakType: string) => {
    try {
      const userId = userIdRef.current;
      if (!userId) return;

      const today = new Date().toISOString().split('T')[0];
      const streak = streaks.find(s => s.streak_type === streakType);

      if (!streak) {
        // Create new streak
        await supabase
          .from('user_streaks')
          .insert([{
            user_id: userId,
            streak_type: streakType,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today
          }]);
      } else {
        const lastActivity = new Date(streak.last_activity_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = streak.current_streak;
        if (daysDiff === 0) {
          return; // Already updated today
        } else if (daysDiff === 1) {
          newStreak += 1; // Continue streak
        } else {
          newStreak = 1; // Reset streak
        }

        const newLongest = Math.max(streak.longest_streak, newStreak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: today
          })
          .eq('user_id', userId)
          .eq('streak_type', streakType);

        // Update local state
        setStreaks(prev => prev.map(s => 
          s.streak_type === streakType 
            ? { ...s, current_streak: newStreak, longest_streak: newLongest, last_activity_date: today }
            : s
        ));

        // Award XP for streak milestones
        if (newStreak % 7 === 0) {
          await awardXP(100, `${newStreak} day ${streakType} streak!`);
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const getXPToNextLevel = () => {
    const nextLevelXP = userXP.current_level * 1000;
    return nextLevelXP - userXP.current_xp;
  };

  const getXPProgress = () => {
    const currentLevelBaseXP = (userXP.current_level - 1) * 1000;
    const nextLevelXP = userXP.current_level * 1000;
    const progressXP = userXP.current_xp - currentLevelBaseXP;
    const levelXPRange = nextLevelXP - currentLevelBaseXP;
    return Math.min((progressXP / levelXPRange) * 100, 100);
  };

  return {
    userXP,
    streaks,
    loading,
    awardXP,
    updateStreak,
    getXPToNextLevel,
    getXPProgress,
    loadGameificationData
  };
};