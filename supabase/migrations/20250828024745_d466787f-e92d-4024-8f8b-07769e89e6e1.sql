-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.notify_users_new_content()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;