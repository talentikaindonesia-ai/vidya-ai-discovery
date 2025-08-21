-- Create scraped_content table for storing web scraped information
CREATE TABLE public.scraped_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source_website TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL DEFAULT 'article', -- article, job, scholarship, competition
  location TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;

-- Create policies for scraped content
CREATE POLICY "Scraped content is publicly readable" 
ON public.scraped_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage scraped content" 
ON public.scraped_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updating timestamps
CREATE TRIGGER update_scraped_content_updated_at
BEFORE UPDATE ON public.scraped_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_scraped_content_category ON public.scraped_content(category);
CREATE INDEX idx_scraped_content_active ON public.scraped_content(is_active);
CREATE INDEX idx_scraped_content_deadline ON public.scraped_content(deadline) WHERE deadline IS NOT NULL;