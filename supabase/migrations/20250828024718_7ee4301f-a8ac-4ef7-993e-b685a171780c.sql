-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Create function to update timestamps
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send notifications when new content is added
CREATE OR REPLACE FUNCTION public.notify_users_new_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all active users about new learning content
  IF TG_TABLE_NAME = 'learning_content' AND NEW.is_active = true THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
    SELECT 
      p.user_id,
      'Konten Pembelajaran Baru!',
      'Konten baru "' || NEW.title || '" telah tersedia untuk Anda.',
      'learning',
      '/learning',
      jsonb_build_object('content_id', NEW.id, 'content_type', NEW.content_type)
    FROM public.profiles p
    WHERE p.subscription_status = 'active';
  END IF;

  -- Notify all users about new opportunities
  IF TG_TABLE_NAME = 'scraped_content' AND NEW.is_active = true THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
    SELECT 
      p.user_id,
      CASE 
        WHEN NEW.category = 'SCHOLARSHIP' THEN 'Beasiswa Baru!'
        WHEN NEW.category = 'COMPETITION' THEN 'Kompetisi Baru!'
        WHEN NEW.category = 'JOB' THEN 'Lowongan Kerja Baru!'
        WHEN NEW.category = 'CONFERENCE' THEN 'Event Baru!'
        ELSE 'Peluang Baru!'
      END,
      'Peluang baru "' || NEW.title || '" telah tersedia.',
      'opportunity',
      '/opportunities',
      jsonb_build_object('opportunity_id', NEW.id, 'category', NEW.category)
    FROM public.profiles p;
  END IF;

  -- Notify users about new challenges
  IF TG_TABLE_NAME = 'community_challenges' AND NEW.is_active = true THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
    SELECT 
      p.user_id,
      'Tantangan Baru!',
      'Tantangan "' || NEW.title || '" telah dimulai. Ikuti sekarang!',
      'challenge',
      '/dashboard?section=quests',
      jsonb_build_object('challenge_id', NEW.id, 'xp_reward', NEW.xp_reward)
    FROM public.profiles p
    WHERE p.subscription_status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER trigger_notify_new_learning_content
  AFTER INSERT ON public.learning_content
  FOR EACH ROW EXECUTE FUNCTION public.notify_users_new_content();

CREATE TRIGGER trigger_notify_new_opportunity
  AFTER INSERT ON public.scraped_content
  FOR EACH ROW EXECUTE FUNCTION public.notify_users_new_content();

CREATE TRIGGER trigger_notify_new_challenge
  AFTER INSERT ON public.community_challenges
  FOR EACH ROW EXECUTE FUNCTION public.notify_users_new_content();