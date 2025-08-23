-- Create gamification system tables

-- XP and leveling system
CREATE TABLE public.user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  total_xp_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Streak tracking
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  streak_type text NOT NULL, -- 'login', 'learning', 'achievement'
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Quest system
CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  quest_type text NOT NULL, -- 'opportunity', 'learning', 'community'
  difficulty text DEFAULT 'easy', -- 'easy', 'medium', 'hard'
  xp_reward integer DEFAULT 100,
  badge_reward text,
  requirements jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User quest progress
CREATE TABLE public.user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.quests(id),
  status text DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  progress_data jsonb DEFAULT '{}',
  completed_at timestamp with time zone,
  xp_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Community challenges
CREATE TABLE public.community_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL, -- 'quiz', 'project', 'peer_review'
  difficulty text DEFAULT 'medium',
  xp_reward integer DEFAULT 200,
  max_participants integer,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User challenge participation
CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.community_challenges(id),
  status text DEFAULT 'joined', -- 'joined', 'submitted', 'completed'
  submission_data jsonb DEFAULT '{}',
  score integer DEFAULT 0,
  rank integer,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Reward store items
CREATE TABLE public.reward_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  item_type text NOT NULL, -- 'discount', 'merchandise', 'premium_content', 'customization'
  xp_cost integer NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  stock_quantity integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User reward purchases
CREATE TABLE public.user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_item_id uuid NOT NULL REFERENCES public.reward_items(id),
  xp_spent integer NOT NULL,
  purchase_date timestamp with time zone DEFAULT now(),
  is_redeemed boolean DEFAULT false,
  redemption_code text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_xp
CREATE POLICY "Users can view and manage their own XP"
ON public.user_xp FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view and manage their own streaks"
ON public.user_streaks FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for quests
CREATE POLICY "Quests are publicly readable"
ON public.quests FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quests"
ON public.quests FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for user_quests
CREATE POLICY "Users can view and manage their own quest progress"
ON public.user_quests FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for community_challenges
CREATE POLICY "Community challenges are publicly readable"
ON public.community_challenges FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage community challenges"
ON public.community_challenges FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for user_challenges
CREATE POLICY "Users can view and manage their own challenge participation"
ON public.user_challenges FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for reward_items
CREATE POLICY "Reward items are publicly readable"
ON public.reward_items FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage reward items"
ON public.reward_items FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for user_rewards
CREATE POLICY "Users can view and manage their own rewards"
ON public.user_rewards FOR ALL
USING (auth.uid() = user_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_quests_updated_at
  BEFORE UPDATE ON public.user_quests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_challenges_updated_at
  BEFORE UPDATE ON public.community_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_items_updated_at
  BEFORE UPDATE ON public.reward_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();