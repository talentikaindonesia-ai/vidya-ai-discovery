-- Fix function search path security warnings

-- Fix log_profile_access function
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix get_profile_secure function
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
SET search_path TO 'public'
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

-- Fix validate_profile_data function
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;