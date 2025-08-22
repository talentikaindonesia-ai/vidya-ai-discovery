-- Create mentors table for expert connections
CREATE TABLE public.mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_sessions INTEGER DEFAULT 0,
  hourly_rate INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Mentors are publicly viewable" 
ON public.mentors 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Mentors can update their own profile" 
ON public.mentors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage mentors" 
ON public.mentors 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create mentor_bookings table
CREATE TABLE public.mentor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.mentor_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.mentor_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.mentor_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert sample mentors
INSERT INTO public.mentors (name, title, bio, expertise_areas, experience_years, rating, total_sessions, hourly_rate) VALUES
('Dr. Sari Indrawati', 'Senior Software Engineer', 'Experienced full-stack developer dengan 8+ tahun pengalaman di teknologi web modern.', ARRAY['JavaScript', 'React', 'Node.js', 'Python'], 8, 4.9, 150, 300000),
('Budi Santoso', 'UX/UI Design Lead', 'Creative director dengan passion untuk user experience dan design thinking.', ARRAY['UI/UX Design', 'Figma', 'Design Thinking', 'User Research'], 6, 4.8, 120, 250000),
('Maria Gonzalez', 'Data Science Manager', 'Expert dalam machine learning dan analytics dengan background statistik yang kuat.', ARRAY['Data Science', 'Machine Learning', 'Python', 'SQL'], 7, 4.9, 200, 350000),
('Ahmad Rizki', 'DevOps Engineer', 'Infrastructure specialist dengan expertise dalam cloud computing dan automation.', ARRAY['DevOps', 'AWS', 'Docker', 'Kubernetes'], 5, 4.7, 80, 280000),
('Lisa Chen', 'Product Manager', 'Strategic product leader dengan track record mengembangkan produk digital sukses.', ARRAY['Product Management', 'Strategy', 'Analytics', 'Leadership'], 9, 4.9, 180, 400000);

-- Add trigger for updated_at
CREATE TRIGGER update_mentors_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();