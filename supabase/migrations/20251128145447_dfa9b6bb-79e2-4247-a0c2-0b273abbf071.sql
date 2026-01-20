-- Add organization_id to roma_reports table
ALTER TABLE public.roma_reports
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Update existing reports to have organization_id from their users
UPDATE public.roma_reports
SET organization_id = (
  SELECT organization_id 
  FROM public.profiles 
  WHERE profiles.user_id = roma_reports.user_id
);

-- Make organization_id not nullable after populating existing data
ALTER TABLE public.roma_reports
ALTER COLUMN organization_id SET NOT NULL;

-- Drop the old policy
DROP POLICY IF EXISTS "All authenticated users can view all reports" ON public.roma_reports;

-- Create new policy to restrict viewing to same organization
CREATE POLICY "Users can view reports in their organization"
ON public.roma_reports
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Update insert policy to include organization check
DROP POLICY IF EXISTS "Users can create their own reports" ON public.roma_reports;

CREATE POLICY "Users can create reports in their organization"
ON public.roma_reports
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  organization_id = get_user_organization_id(auth.uid())
);