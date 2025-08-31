import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGameification } from './useGameification';

export interface QuizCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category_id: string;
  difficulty: string;
  question_type: string;
  question: string;
  options: any;
  correct_answer: string;
  explanation: string;
  clue_location: string;
  media_url: string;
  points_reward: number;
  is_isc_exclusive: boolean;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  completed_at: string;
  time_taken_seconds: number;
}

export interface QuizLeaderboard {
  id: string;
  user_id: string;
  total_points: number;
  total_quizzes_completed: number;
  correct_answers: number;
  current_streak: number;
  longest_streak: number;
  rank_position: number;
  profiles?: any;
}

export const useQuizSystem = () => {
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboard[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { awardXP, updateStreak } = useGameification();

  useEffect(() => {
    loadCategories();
    loadUserQuizHistory();
    loadLeaderboard();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading quiz categories:', error);
    }
  };

  const loadQuizzesByCategory = async (categoryId: string): Promise<Quiz[]> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading quizzes:', error);
      return [];
    }
  };

  const getRandomQuiz = async (categoryId?: string, difficulty?: string): Promise<Quiz | null> => {
    try {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (difficulty) query = query.eq('difficulty', difficulty);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex];
      }
      return null;
    } catch (error) {
      console.error('Error getting random quiz:', error);
      return null;
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setLoading(false);
  };

  const submitQuizAnswer = async (answer: string, timeTaken: number = 0) => {
    if (!currentQuiz) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const isCorrect = answer.toLowerCase().trim() === currentQuiz.correct_answer.toLowerCase().trim();
      const pointsEarned = isCorrect ? currentQuiz.points_reward : 0;

      // Save quiz attempt
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: user.id,
          quiz_id: currentQuiz.id,
          user_answer: answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken_seconds: timeTaken
        }]);

      if (attemptError) throw attemptError;

      // Award XP through gamification system
      if (isCorrect) {
        await awardXP(pointsEarned, `Correct answer: ${currentQuiz.title}`);
        await updateStreak('learning');
      }

      // Show result
      toast({
        title: isCorrect ? "🎉 Correct!" : "❌ Incorrect",
        description: isCorrect 
          ? `You earned ${pointsEarned} points!` 
          : `The correct answer was: ${currentQuiz.correct_answer}`,
        duration: 5000,
      });

      // Reload user data
      await loadUserQuizHistory();
      await loadLeaderboard();

      return { isCorrect, pointsEarned, explanation: currentQuiz.explanation };
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadUserQuizHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQuizHistory(data || []);
    } catch (error) {
      console.error('Error loading quiz history:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .order('total_points', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getUserQuizStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error loading user quiz stats:', error);
      return null;
    }
  };

  const resetCurrentQuiz = () => {
    setCurrentQuiz(null);
  };

  return {
    categories,
    currentQuiz,
    quizHistory,
    leaderboard,
    loading,
    loadQuizzesByCategory,
    getRandomQuiz,
    startQuiz,
    submitQuizAnswer,
    getUserQuizStats,
    resetCurrentQuiz,
    loadLeaderboard
  };
};