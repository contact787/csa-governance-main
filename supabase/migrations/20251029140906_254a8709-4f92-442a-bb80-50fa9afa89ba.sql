-- Ensure SELECT policies on profiles are permissive so admins can view all users in their organization
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Recreate admin SELECT policy explicitly as permissive (default) to avoid restrictive AND behavior
DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can view profiles in their organization"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = public.get_user_organization_id(auth.uid())
);