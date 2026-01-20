-- Drop the view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.messaging_profiles;

CREATE VIEW public.messaging_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization_id
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.messaging_profiles TO authenticated;