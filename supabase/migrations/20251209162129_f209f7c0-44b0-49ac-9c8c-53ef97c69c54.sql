-- Allow all authenticated users to view profiles in their organization (needed for Inbox)
CREATE POLICY "Users can view profiles in their organization for messaging" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  organization_id = get_user_organization_id(auth.uid())
);