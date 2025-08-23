-- Create storage bucket for opportunity posters
INSERT INTO storage.buckets (id, name, public) VALUES ('opportunity-posters', 'opportunity-posters', true);

-- Create RLS policies for opportunity posters bucket
CREATE POLICY "Anyone can view opportunity posters" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'opportunity-posters');

CREATE POLICY "Admins can upload opportunity posters" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'opportunity-posters' AND has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update opportunity posters" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'opportunity-posters' AND has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete opportunity posters" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'opportunity-posters' AND has_role(auth.uid(), 'admin'::user_role));

-- Add additional columns to scraped_content for manual opportunities
ALTER TABLE public.scraped_content 
ADD COLUMN IF NOT EXISTS poster_url TEXT,
ADD COLUMN IF NOT EXISTS registration_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requirements TEXT[],
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB,
ADD COLUMN IF NOT EXISTS prize_info TEXT,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;