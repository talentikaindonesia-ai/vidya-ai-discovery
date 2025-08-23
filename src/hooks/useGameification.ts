import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    loadGameificationData();
  }, []);

  const loadGameificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load XP data
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpData) {
        setUserXP(xpData);
      } else {
        // Initialize XP for new user
        await initializeUserXP(user.id);
      }

      // Load streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
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
      const { data, error } = await supabase
        .from('user_xp')
        .insert([{ user_id: userId, current_xp: 0, current_level: 1, total_xp_earned: 0 }])
        .select()
        .single();

      if (error) throw error;
      setUserXP(data);

      // Initialize basic streaks
      const streakTypes = ['login', 'learning', 'achievement'];
      for (const type of streakTypes) {
        await supabase
          .from('user_streaks')
          .insert([{ user_id: userId, streak_type: type, current_streak: 0, longest_streak: 0 }]);
      }
    } catch (error) {
      console.error('Error initializing user XP:', error);
    }
  };

  const awardXP = async (amount: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newXP = userXP.current_xp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level
      const levelUp = newLevel > userXP.current_level;

      const { data, error } = await supabase
        .from('user_xp')
        .update({
          current_xp: newXP,
          current_level: newLevel,
          total_xp_earned: userXP.total_xp_earned + amount
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserXP(data);

      // Show XP notification
      toast({
        title: `+${amount} XP`,
        description: reason,
        duration: 3000,
      });

      // Show level up notification
      if (levelUp) {
        toast({
          title: "🎉 Level Up!",
          description: `Congratulations! You reached level ${newLevel}!`,
          duration: 5000,
        });
      }

      return { levelUp, newLevel };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return null;
    }
  };

  const updateStreak = async (streakType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const streak = streaks.find(s => s.streak_type === streakType);

      if (!streak) {
        // Create new streak
        await supabase
          .from('user_streaks')
          .insert([{
            user_id: user.id,
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
          .eq('user_id', user.id)
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