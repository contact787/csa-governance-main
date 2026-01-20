-- Add updated_by column to organization_standards
ALTER TABLE public.organization_standards
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Add comment for clarity
COMMENT ON COLUMN public.organization_standards.updated_by IS 'User who last updated the standard (document upload, due date change, frequency change)';