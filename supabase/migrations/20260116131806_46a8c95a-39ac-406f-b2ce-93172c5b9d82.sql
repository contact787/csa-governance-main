-- Allow users to insert their own role during signup
-- This is needed because new users don't have any role yet
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);