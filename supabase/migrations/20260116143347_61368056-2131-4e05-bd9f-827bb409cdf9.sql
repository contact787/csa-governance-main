-- Add policy for master admins to update all profiles
CREATE POLICY "Master admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'master_admin'::app_role));