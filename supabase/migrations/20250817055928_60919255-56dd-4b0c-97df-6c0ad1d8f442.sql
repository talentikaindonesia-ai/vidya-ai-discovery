-- Add subscription and role management
-- Add subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER NOT NULL, -- in cents
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for subscription plans
CREATE POLICY "Subscription plans are publicly readable"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Add user roles enum and table
CREATE TYPE public.user_role AS ENUM ('admin', 'individual', 'school');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role user_role NOT NULL DEFAULT 'individual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update profiles table to include subscription and organization info
ALTER TABLE public.profiles 
ADD COLUMN organization_name TEXT,
ADD COLUMN organization_type TEXT CHECK (organization_type IN ('school', 'institution', 'company')),
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT;

-- Add assessment results table for comprehensive personality test
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'personality_interest',
  questions_answers JSONB NOT NULL,
  personality_type TEXT,
  interest_categories UUID[] DEFAULT '{}',
  talent_areas TEXT[] DEFAULT '{}',
  learning_style TEXT,
  career_recommendations TEXT[] DEFAULT '{}',
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Users can manage their own assessment results
CREATE POLICY "Users can manage their own assessment results"
ON public.assessment_results
FOR ALL
USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Individual Basic', 'Perfect for individual learners', 99000, 999000, '["Access to basic courses", "Progress tracking", "Certificate of completion", "Email support"]'::jsonb),
('Individual Premium', 'Complete learning experience for individuals', 199000, 1999000, '["Access to all courses", "1-on-1 mentoring", "Advanced analytics", "Priority support", "Career guidance", "Portfolio builder"]'::jsonb),
('School Basic', 'For educational institutions', 999000, 9999000, '["Up to 100 students", "Teacher dashboard", "Student progress tracking", "Bulk certificates", "Basic reporting"]'::jsonb),
('School Premium', 'Complete solution for schools', 1999000, 19999000, '["Unlimited students", "Advanced teacher tools", "Custom curriculum", "Detailed analytics", "API access", "Dedicated support"]'::jsonb);

-- Update handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  
  -- Assign default role (individual)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'individual');
  
  RETURN NEW;
END;
$$;