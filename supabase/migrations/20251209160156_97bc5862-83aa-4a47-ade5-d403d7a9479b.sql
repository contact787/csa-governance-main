-- Fix 1: Update announcements SELECT policy to require authentication for global announcements
DROP POLICY IF EXISTS "Users can view relevant announcements" ON public.announcements;
CREATE POLICY "Users can view relevant announcements" ON public.announcements
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (is_global = true) OR 
    (organization_id = get_user_organization_id(auth.uid()))
  )
);

-- Fix 2: Add explicit authentication check to profiles SELECT policies
-- The existing policies already use auth.uid() comparisons, but we'll make them more explicit
-- by ensuring they only work for authenticated users

-- Drop and recreate the "Users can view their own profile" policy with explicit auth check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Drop and recreate the "Admins can view profiles in their organization" policy
DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can view profiles in their organization" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role) AND 
  (organization_id = get_user_organization_id(auth.uid()))
);

-- Drop and recreate the "Compliance managers can view profiles in their organization" policy
DROP POLICY IF EXISTS "Compliance managers can view profiles in their organization" ON public.profiles;
CREATE POLICY "Compliance managers can view profiles in their organization" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'compliance_manager'::app_role) AND 
  (organization_id = get_user_organization_id(auth.uid()))
);