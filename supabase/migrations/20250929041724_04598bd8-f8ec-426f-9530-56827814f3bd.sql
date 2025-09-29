-- Create function to increment article view count
CREATE OR REPLACE FUNCTION public.increment_article_view_count(article_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles 
  SET view_count = view_count + 1 
  WHERE id = article_id AND is_published = true;
END;
$$;