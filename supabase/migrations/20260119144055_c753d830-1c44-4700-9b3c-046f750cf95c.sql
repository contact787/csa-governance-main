-- Fix participation_logs RLS policy to include master_admin role
-- First drop the existing policy
DROP POLICY IF EXISTS "Staff can manage participation logs" ON public.participation_logs;

-- Recreate with master_admin included
CREATE POLICY "Staff can manage participation logs"
ON public.participation_logs
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM organization_standards os
    WHERE os.id = participation_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);