-- Remove the policy that exposes email addresses
DROP POLICY IF EXISTS "Users can view announcement creators" ON public.profiles;

-- Add creator_name column to announcements table to avoid needing to query profiles
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS creator_name text;

-- Update existing announcements with creator names
UPDATE public.announcements a
SET creator_name = p.full_name
FROM public.profiles p
WHERE a.created_by = p.user_id AND a.creator_name IS NULL;