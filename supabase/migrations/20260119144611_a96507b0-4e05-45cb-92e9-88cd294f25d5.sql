-- Fix method_evidence RLS policy to include master_admin role
DROP POLICY IF EXISTS "Staff can manage method evidence" ON public.method_evidence;

CREATE POLICY "Staff can manage method evidence"
ON public.method_evidence
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM organization_standards os
    WHERE os.id = method_evidence.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);

-- Fix participation_log_evidence RLS policy to include master_admin role
DROP POLICY IF EXISTS "Staff can manage log evidence" ON public.participation_log_evidence;

CREATE POLICY "Staff can manage log evidence"
ON public.participation_log_evidence
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM participation_logs pl
    JOIN organization_standards os ON os.id = pl.organization_standard_id
    WHERE pl.id = participation_log_evidence.participation_log_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);

-- Fix secondary_logs RLS policy to include master_admin role
DROP POLICY IF EXISTS "Staff can manage secondary logs" ON public.secondary_logs;

CREATE POLICY "Staff can manage secondary logs"
ON public.secondary_logs
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM organization_standards os
    WHERE os.id = secondary_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);

-- Fix participation_methods RLS policy to include master_admin role
DROP POLICY IF EXISTS "Staff can manage participation methods" ON public.participation_methods;

CREATE POLICY "Staff can manage participation methods"
ON public.participation_methods
FOR ALL
USING (
  (EXISTS (
    SELECT 1
    FROM organization_standards os
    WHERE os.id = participation_methods.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);

-- Fix standard_activity_logs INSERT policy to include master_admin role
DROP POLICY IF EXISTS "Staff can insert activity logs" ON public.standard_activity_logs;

CREATE POLICY "Staff can insert activity logs"
ON public.standard_activity_logs
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM organization_standards os
    WHERE os.id = standard_activity_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  ))
  AND (
    has_role(auth.uid(), 'staff'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'compliance_manager'::app_role)
    OR has_role(auth.uid(), 'master_admin'::app_role)
  )
);