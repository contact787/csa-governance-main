-- Add due_date column to organization_standards table
ALTER TABLE public.organization_standards 
ADD COLUMN IF NOT EXISTS due_date DATE;