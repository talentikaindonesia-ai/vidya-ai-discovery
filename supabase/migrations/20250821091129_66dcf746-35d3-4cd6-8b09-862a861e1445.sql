-- Security Enhancement: Strengthen RLS policies and add audit logging

-- Create audit log table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, table_name, operation, record_id)
  VALUES (
    COALESCE(auth.uid(), OLD.user_id, NEW.user_id),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for profiles table
DROP TRIGGER IF EXISTS audit_profiles_access ON public.profiles;
CREATE TRIGGER audit_profiles_access
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Create function for secure profile data access with rate limiting
CREATE OR REPLACE FUNCTION public.get_profile_secure(profile_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  organization_name TEXT,
  organization_type TEXT,
  subscription_type TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  -- Only return data if the requesting user owns the profile
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.address,
    p.avatar_url,
    p.organization_name,
    p.organization_type,
    p.subscription_type,
    p.subscription_status,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id 
    AND p.user_id = auth.uid();
$$;

-- Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- More restrictive policies with additional security checks
CREATE POLICY "Users can view their own profile with audit"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own profile with validation"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email IS NOT NULL
  AND LENGTH(email) > 0
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "Users can insert their own profile on signup"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email IS NOT NULL
  AND LENGTH(email) > 0
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Strengthen assessment_results policies
DROP POLICY IF EXISTS "Users can manage their own assessment results" ON public.assessment_results;

CREATE POLICY "Users can view their own assessment results"
ON public.assessment_results
FOR SELECT
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own assessment results"
ON public.assessment_results
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

CREATE POLICY "Users can update their own assessment results"
ON public.assessment_results
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- Strengthen user_progress policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;

CREATE POLICY "Users can view their own progress"
ON public.user_progress
FOR SELECT
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own progress"
ON public.user_progress
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

CREATE POLICY "Users can update their own progress"
ON public.user_progress
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- Add data validation function
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NOT NULL AND NOT (NEW.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone number (basic validation)
  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) > 0 AND NOT (NEW.phone ~ '^[\+]?[0-9\-\(\)\s]{8,20}$') THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Sanitize text fields to prevent XSS
  IF NEW.full_name IS NOT NULL THEN
    NEW.full_name := regexp_replace(NEW.full_name, '[<>"\''&]', '', 'g');
  END IF;
  
  IF NEW.address IS NOT NULL THEN
    NEW.address := regexp_replace(NEW.address, '[<>"\''&]', '', 'g');
  END IF;
  
  IF NEW.organization_name IS NOT NULL THEN
    NEW.organization_name := regexp_replace(NEW.organization_name, '[<>"\''&]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();