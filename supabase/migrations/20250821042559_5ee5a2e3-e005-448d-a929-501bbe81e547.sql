-- Enable Row Level Security on the Vidya table
ALTER TABLE public."Vidya" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to Vidya content
CREATE POLICY "Vidya content is publicly readable" 
ON public."Vidya" 
FOR SELECT 
USING (true);

-- Create policy to allow only admins to insert content
CREATE POLICY "Only admins can create Vidya content" 
ON public."Vidya" 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create policy to allow only admins to update content
CREATE POLICY "Only admins can update Vidya content" 
ON public."Vidya" 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create policy to allow only admins to delete content
CREATE POLICY "Only admins can delete Vidya content" 
ON public."Vidya" 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role));