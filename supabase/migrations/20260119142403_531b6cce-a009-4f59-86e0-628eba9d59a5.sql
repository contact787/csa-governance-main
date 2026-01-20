-- Fix messaging_profiles view to use SECURITY INVOKER (respects RLS of underlying profiles table)
-- First drop the existing view
DROP VIEW IF EXISTS public.messaging_profiles;

-- Recreate the view with SECURITY INVOKER to respect RLS on base tables
CREATE VIEW public.messaging_profiles
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.organization_id,
  p.full_name,
  p.avatar_url
FROM public.profiles p
WHERE p.organization_id = get_user_organization_id(auth.uid());

-- Grant access to authenticated users only
REVOKE ALL ON public.messaging_profiles FROM anon;
GRANT SELECT ON public.messaging_profiles TO authenticated;

-- Fix profiles table: Add a policy to ensure staff can see colleagues in their organization for messaging
-- This is needed for the inbox feature to work properly
CREATE POLICY "Staff can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND has_role(auth.uid(), 'staff'::app_role) 
  AND (organization_id = get_user_organization_id(auth.uid()))
);

-- Add board_member policy for viewing profiles in their organization
CREATE POLICY "Board members can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND has_role(auth.uid(), 'board_member'::app_role) 
  AND (organization_id = get_user_organization_id(auth.uid()))
);

-- Fix system_alerts: Add explicit authentication requirement for any access
-- The current policies only allow admins/master_admins, but let's make sure no anonymous access is possible
-- First, let's add a policy that explicitly denies anonymous access by requiring authentication for all operations
-- Note: The existing policies already require admin/master_admin roles which implicitly require auth,
-- but let's add a baseline authenticated policy for staff users who should see their own alerts
CREATE POLICY "Authenticated users can view alerts assigned to them"
ON public.system_alerts
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND (user_id = auth.uid())
);