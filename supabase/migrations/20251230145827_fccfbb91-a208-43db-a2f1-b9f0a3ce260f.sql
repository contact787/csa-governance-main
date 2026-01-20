-- Add RLS policy for master_admin to view all organizations
CREATE POLICY "Master admins can view all organizations"
ON public.organizations
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Add RLS policy for master_admin to update all organizations
CREATE POLICY "Master admins can update all organizations"
ON public.organizations
FOR UPDATE
USING (has_role(auth.uid(), 'master_admin'));

-- Add RLS policy for master_admin to delete all organizations
CREATE POLICY "Master admins can delete all organizations"
ON public.organizations
FOR DELETE
USING (has_role(auth.uid(), 'master_admin'));

-- Add RLS policy for master_admin to view all profiles
CREATE POLICY "Master admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Add RLS policy for master_admin to delete profiles
CREATE POLICY "Master admins can delete all profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'master_admin'));

-- Add RLS policy for master_admin to manage all user roles
CREATE POLICY "Master admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'master_admin'));