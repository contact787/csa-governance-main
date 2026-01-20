-- Create security definer function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop and recreate profiles RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can view profiles in their organization"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = public.get_user_organization_id(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can update profiles in their organization"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = public.get_user_organization_id(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can delete profiles in their organization"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = public.get_user_organization_id(auth.uid())
);