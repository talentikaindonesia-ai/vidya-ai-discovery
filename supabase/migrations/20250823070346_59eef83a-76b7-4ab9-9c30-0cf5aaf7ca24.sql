-- Fix RLS policy for scraped_content to allow manual opportunity creation
-- First, let's check if current user has admin role and assign if needed

-- Update the RLS policy for scraped_content to allow manual content creation
DROP POLICY IF EXISTS "Admins can manage scraped content" ON public.scraped_content;

-- Create more flexible policies
CREATE POLICY "Admins can manage all scraped content" 
ON public.scraped_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can create manual content" 
ON public.scraped_content 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_manual = true);

CREATE POLICY "Authenticated users can update their manual content" 
ON public.scraped_content 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_manual = true);

CREATE POLICY "Authenticated users can delete their manual content" 
ON public.scraped_content 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_manual = true);

-- Ensure we have at least one admin user
-- This will assign admin role to any authenticated user if no admin exists
DO $$
DECLARE
    admin_count INTEGER;
    current_user_id UUID;
BEGIN
    -- Check if there are any admin users
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles 
    WHERE role = 'admin';
    
    -- If no admin users exist, make current user admin
    IF admin_count = 0 THEN
        -- Get current authenticated user
        SELECT auth.uid() INTO current_user_id;
        
        -- Only proceed if there's an authenticated user
        IF current_user_id IS NOT NULL THEN
            -- Insert admin role for current user (will be ignored if already exists)
            INSERT INTO public.user_roles (user_id, role)
            VALUES (current_user_id, 'admin'::user_role)
            ON CONFLICT (user_id, role) DO NOTHING;
            
            RAISE NOTICE 'Admin role assigned to current user';
        END IF;
    END IF;
END $$;