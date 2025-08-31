-- Create quiz categories table
CREATE TABLE public.quiz_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.quiz_categories(id),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  clue_location TEXT, -- ISC zone/location reference
  media_url TEXT, -- Image/video from ISC
  points_reward INTEGER DEFAULT 10,
  is_isc_exclusive BOOLEAN DEFAULT false, -- QR code exclusive quizzes
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id),
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken_seconds INTEGER DEFAULT 0
);

-- Create quiz challenges table
CREATE TABLE public.quiz_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'monthly' CHECK (challenge_type IN ('monthly', 'weekly', 'special', 'isc_onsite')),
  category_id UUID REFERENCES public.quiz_categories(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  quiz_ids UUID[] DEFAULT '{}',
  min_score INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 100,
  reward_badge TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz leaderboard view
CREATE TABLE public.quiz_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_quiz_date DATE,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_categories
CREATE POLICY "Quiz categories are publicly readable"
ON public.quiz_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quiz categories"
ON public.quiz_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for quizzes
CREATE POLICY "Active quizzes are publicly readable"
ON public.quizzes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quizzes"
ON public.quizzes FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for quiz_challenges
CREATE POLICY "Active quiz challenges are publicly readable"
ON public.quiz_challenges FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quiz challenges"
ON public.quiz_challenges FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for quiz_leaderboard
CREATE POLICY "Quiz leaderboard is publicly readable"
ON public.quiz_leaderboard FOR SELECT
USING (true);

CREATE POLICY "Users can update their own leaderboard stats"
ON public.quiz_leaderboard FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_quizzes_category ON public.quizzes(category_id);
CREATE INDEX idx_quizzes_difficulty ON public.quizzes(difficulty);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_leaderboard_points ON public.quiz_leaderboard(total_points DESC);
CREATE INDEX idx_quiz_leaderboard_rank ON public.quiz_leaderboard(rank_position);

-- Create function to update quiz leaderboard
CREATE OR REPLACE FUNCTION public.update_quiz_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  current_user_stats RECORD;
  new_streak INTEGER := 1;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get current user stats
  SELECT * INTO current_user_stats
  FROM public.quiz_leaderboard
  WHERE user_id = NEW.user_id;

  -- Calculate streak
  IF current_user_stats.last_quiz_date IS NOT NULL THEN
    IF current_user_stats.last_quiz_date = today_date THEN
      -- Same day, keep current streak
      new_streak := current_user_stats.current_streak;
    ELSIF current_user_stats.last_quiz_date = today_date - INTERVAL '1 day' THEN
      -- Consecutive day, increment streak
      new_streak := current_user_stats.current_streak + 1;
    ELSE
      -- Streak broken, reset to 1
      new_streak := 1;
    END IF;
  END IF;

  -- Update or insert leaderboard record
  INSERT INTO public.quiz_leaderboard (
    user_id,
    total_points,
    total_quizzes_completed,
    correct_answers,
    current_streak,
    longest_streak,
    last_quiz_date
  ) VALUES (
    NEW.user_id,
    NEW.points_earned,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    new_streak,
    new_streak,
    today_date
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = quiz_leaderboard.total_points + NEW.points_earned,
    total_quizzes_completed = quiz_leaderboard.total_quizzes_completed + 1,
    correct_answers = quiz_leaderboard.correct_answers + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    current_streak = new_streak,
    longest_streak = GREATEST(quiz_leaderboard.longest_streak, new_streak),
    last_quiz_date = today_date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update leaderboard on quiz completion
CREATE TRIGGER update_quiz_leaderboard_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quiz_leaderboard();

-- Create function to update leaderboard rankings
CREATE OR REPLACE FUNCTION public.update_quiz_rankings()
RETURNS void AS $$
BEGIN
  UPDATE public.quiz_leaderboard
  SET rank_position = ranked.new_rank
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_answers DESC, total_quizzes_completed DESC) as new_rank
    FROM public.quiz_leaderboard
  ) ranked
  WHERE quiz_leaderboard.user_id = ranked.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default quiz categories
INSERT INTO public.quiz_categories (name, description, icon, color) VALUES
('Physics', 'Fisika - Eksplorasi dunia fisika melalui eksperimen ISC', 'Zap', '#8B5CF6'),
('Biology', 'Biologi - Jelajahi kehidupan dan organisme', 'Leaf', '#10B981'),
('Chemistry', 'Kimia - Reaksi dan unsur-unsur kimia', 'Flask', '#F59E0B'),
('Astronomy', 'Astronomi - Tata surya dan luar angkasa', 'Star', '#3B82F6'),
('Technology', 'Teknologi - Inovasi dan perkembangan teknologi', 'Cpu', '#EF4444'),
('Environment', 'Lingkungan - Ekologi dan konservasi', 'Trees', '#059669');

-- Add updated_at triggers
CREATE TRIGGER update_quiz_categories_updated_at
  BEFORE UPDATE ON public.quiz_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_challenges_updated_at
  BEFORE UPDATE ON public.quiz_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_leaderboard_updated_at
  BEFORE UPDATE ON public.quiz_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();