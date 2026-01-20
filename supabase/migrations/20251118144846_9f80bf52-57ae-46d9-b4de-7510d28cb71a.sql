-- Allow compliance managers to view profiles in their own organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Compliance managers can view profiles in their organization'
  ) THEN
    CREATE POLICY "Compliance managers can view profiles in their organization"
    ON public.profiles
    FOR SELECT
    USING (
      has_role(auth.uid(), 'compliance_manager'::app_role)
      AND organization_id = get_user_organization_id(auth.uid())
    );
  END IF;
END $$;