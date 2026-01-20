-- Add category column to standards table
ALTER TABLE public.standards ADD COLUMN category TEXT;

-- Update existing standards with their categories
UPDATE public.standards SET category = 'consumer-input' WHERE standard_id IN ('1.1', '1.2', '1.3');
UPDATE public.standards SET category = 'community-engagement' WHERE standard_id IN ('2.1', '2.2', '2.3');
UPDATE public.standards SET category = 'community-assessment' WHERE standard_id IN ('3.1', '3.2', '3.3');
UPDATE public.standards SET category = 'organizational-leadership' WHERE standard_id IN ('4.1', '4.2', '4.3', '4.4', '4.5');