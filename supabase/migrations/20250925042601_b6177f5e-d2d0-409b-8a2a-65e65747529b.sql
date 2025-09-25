-- Update existing subscription packages to match new membership system
-- Use existing type constraints but update content to match requirements

-- Update the existing packages to match the new membership plans
UPDATE public.subscription_packages 
SET 
  name = 'Individual',
  features = '[
    "Tes minat & bakat dasar",
    "Basic assessment report (Lite)", 
    "Rekomendasi jalur studi awal",
    "Akses kursus online dasar",
    "Progress tracking",
    "Forum komunitas umum", 
    "1x Konsultasi per bulan"
  ]'::jsonb,
  max_courses = 10,
  max_opportunities = 15
WHERE type = 'premium_individual' AND price_monthly = 39000;

UPDATE public.subscription_packages
SET 
  name = 'Premium',
  features = '[
    "Semua fitur Individual",
    "Full assessment report (detail)",
    "Analisis skill & potensi mendalam", 
    "Konsultasi tanpa batas dengan mentor",
    "Akses kursus premium lengkap",
    "Portofolio builder untuk beasiswa/magang",
    "Networking dengan profesional & industri",
    "Program mentorship intensif", 
    "Sertifikat skill digital"
  ]'::jsonb,
  max_courses = -1,
  max_opportunities = -1  
WHERE type = 'premium_individual' AND price_monthly = 99000;

-- Deactivate other packages that don't fit new membership model
UPDATE public.subscription_packages 
SET is_active = false 
WHERE type IN ('family', 'school', 'free') OR name NOT IN ('Individual', 'Premium');

-- Create mentorship sessions table
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'consultation',
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create portfolio items table  
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL,
  file_url TEXT,
  external_url TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create networking connections table
CREATE TABLE IF NOT EXISTS public.networking_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connected_user_id UUID NOT NULL,
  connection_type TEXT DEFAULT 'professional',
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, connected_user_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_premium_only BOOLEAN DEFAULT false,
  location TEXT,
  organizer_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certificate_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issuer TEXT DEFAULT 'Talentika',
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  verification_code TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own mentorship sessions"
  ON public.mentorship_sessions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = mentor_id);

CREATE POLICY "Users can create mentorship sessions"
  ON public.mentorship_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio"
  ON public.portfolio_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public portfolios viewable by all"
  ON public.portfolio_items FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can view their own connections"
  ON public.networking_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections"
  ON public.networking_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Active events are publicly viewable"
  ON public.community_events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT  
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));