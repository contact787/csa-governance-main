-- Allow authenticated users to view profiles of announcement creators
CREATE POLICY "Users can view announcement creators"
ON public.profiles
FOR SELECT
USING (
  user_id IN (
    SELECT created_by FROM public.announcements 
    WHERE is_global = true 
    OR organization_id = get_user_organization_id(auth.uid())
  )
);