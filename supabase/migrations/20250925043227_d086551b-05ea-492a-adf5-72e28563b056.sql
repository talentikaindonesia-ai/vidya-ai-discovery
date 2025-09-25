-- Fix foreign key relationships and add missing tables

-- Create event_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attendance_status TEXT DEFAULT 'registered',
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_participants
CREATE POLICY "Users can manage their own event participation" 
ON public.event_participants FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view participants"
ON public.event_participants FOR SELECT  
USING (
  EXISTS (
    SELECT 1 FROM public.community_events 
    WHERE id = event_id AND organizer_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::user_role)
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for mentorship_sessions -> mentors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mentorship_sessions_mentor_id_fkey'
  ) THEN
    ALTER TABLE public.mentorship_sessions 
    ADD CONSTRAINT mentorship_sessions_mentor_id_fkey 
    FOREIGN KEY (mentor_id) REFERENCES public.mentors(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for mentorship_sessions -> profiles (user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mentorship_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.mentorship_sessions 
    ADD CONSTRAINT mentorship_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for networking_connections -> profiles (user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'networking_connections_user_id_fkey'
  ) THEN
    ALTER TABLE public.networking_connections 
    ADD CONSTRAINT networking_connections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for networking_connections -> profiles (connected_user_id) 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'networking_connections_connected_user_id_fkey'
  ) THEN
    ALTER TABLE public.networking_connections 
    ADD CONSTRAINT networking_connections_connected_user_id_fkey 
    FOREIGN KEY (connected_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for portfolio_items -> profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'portfolio_items_user_id_fkey'
  ) THEN
    ALTER TABLE public.portfolio_items 
    ADD CONSTRAINT portfolio_items_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for certificates -> profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'certificates_user_id_fkey'
  ) THEN
    ALTER TABLE public.certificates 
    ADD CONSTRAINT certificates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;