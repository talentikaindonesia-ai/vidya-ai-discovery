-- Enhanced learning content tables for Learning Hub
CREATE TABLE IF NOT EXISTS public.learning_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  parent_id UUID REFERENCES public.learning_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'course', -- course, video, article, module, microlearning
  content_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  target_personas TEXT[] DEFAULT '{}', -- array of target user types
  category_id UUID REFERENCES public.learning_categories(id),
  tags TEXT[] DEFAULT '{}',
  external_source TEXT, -- youtube, coursera, edx, etc
  external_id TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  priority_score INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.learning_content(id),
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, bookmarked
  progress_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_persona TEXT,
  estimated_duration_hours INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_path_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id),
  content_id UUID NOT NULL REFERENCES public.learning_content(id),
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_contents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_categories
CREATE POLICY "Learning categories are publicly readable" 
ON public.learning_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage learning categories" 
ON public.learning_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for learning_content
CREATE POLICY "Learning content is publicly readable" 
ON public.learning_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage learning content" 
ON public.learning_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for learning_progress
CREATE POLICY "Users can view their own learning progress" 
ON public.learning_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning progress" 
ON public.learning_progress 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for learning_paths
CREATE POLICY "Learning paths are publicly readable" 
ON public.learning_paths 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage learning paths" 
ON public.learning_paths 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for learning_path_contents
CREATE POLICY "Learning path contents are publicly readable" 
ON public.learning_path_contents 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage learning path contents" 
ON public.learning_path_contents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Triggers for updated_at
CREATE TRIGGER update_learning_categories_updated_at
BEFORE UPDATE ON public.learning_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_content_updated_at
BEFORE UPDATE ON public.learning_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
BEFORE UPDATE ON public.learning_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample learning categories
INSERT INTO public.learning_categories (name, description, icon, color) VALUES
('STEM', 'Science, Technology, Engineering & Mathematics', 'Atom', '#10B981'),
('Arts & Creative', 'Design, Art, Music, Creative Writing', 'Palette', '#F59E0B'),
('Business & Finance', 'Entrepreneurship, Management, Finance', 'TrendingUp', '#3B82F6'),
('Social Sciences', 'Psychology, Sociology, Communication', 'Users', '#8B5CF6'),
('Language & Literature', 'Languages, Writing, Literature', 'BookOpen', '#EF4444'),
('Health & Wellness', 'Medical, Sports, Nutrition', 'Heart', '#EC4899'),
('Life Skills', 'Leadership, Time Management, Productivity', 'Target', '#06B6D4');

-- Insert sample learning content
INSERT INTO public.learning_content (title, description, content_type, content_url, duration_minutes, difficulty_level, target_personas, category_id, tags, is_featured) VALUES
('Introduction to Programming', 'Learn the basics of programming with Python', 'course', 'https://example.com/python-basics', 120, 'beginner', '{"Pelajar SMA", "Mahasiswa"}', (SELECT id FROM learning_categories WHERE name = 'STEM'), '{"programming", "python", "coding"}', true),
('Digital Marketing Fundamentals', 'Master the basics of digital marketing', 'course', 'https://example.com/digital-marketing', 90, 'beginner', '{"Mahasiswa", "Fresh Graduate"}', (SELECT id FROM learning_categories WHERE name = 'Business & Finance'), '{"marketing", "digital", "social media"}', true),
('Graphic Design Principles', 'Learn essential design principles', 'video', 'https://youtube.com/watch?v=design123', 45, 'beginner', '{"Pelajar SMA", "Mahasiswa"}', (SELECT id FROM learning_categories WHERE name = 'Arts & Creative'), '{"design", "graphics", "visual"}', false),
('Public Speaking Mastery', 'Build confidence in public speaking', 'course', 'https://example.com/public-speaking', 60, 'intermediate', '{"Mahasiswa", "Fresh Graduate", "Mentor"}', (SELECT id FROM learning_categories WHERE name = 'Social Sciences'), '{"communication", "presentation", "confidence"}', true),
('Financial Literacy for Students', 'Personal finance management skills', 'module', 'https://example.com/finance-module', 30, 'beginner', '{"Pelajar SMA", "Mahasiswa"}', (SELECT id FROM learning_categories WHERE name = 'Business & Finance'), '{"finance", "money", "budgeting"}', false);