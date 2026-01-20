-- Create a secure view for messaging that only exposes necessary fields (no email)
CREATE OR REPLACE VIEW public.messaging_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization_id
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.messaging_profiles TO authenticated;

-- Drop the overly permissive policy that exposes emails
DROP POLICY IF EXISTS "Users can view profiles in their organization for messaging" ON public.profiles;