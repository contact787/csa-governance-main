-- Add frequency column to organization_standards
ALTER TABLE public.organization_standards
ADD COLUMN frequency text;