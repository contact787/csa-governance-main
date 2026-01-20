-- Add foreign key from updated_by to profiles for easier joins
-- First drop the existing constraint to auth.users if exists
ALTER TABLE public.organization_standards
DROP CONSTRAINT IF EXISTS organization_standards_updated_by_fkey;

-- Add foreign key to profiles table (user_id column)
ALTER TABLE public.organization_standards
ADD CONSTRAINT organization_standards_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id);