-- Add language preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'id' CHECK (language_preference IN ('id', 'en'));

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.language_preference IS 'User preferred language: id (Indonesian) or en (English)';