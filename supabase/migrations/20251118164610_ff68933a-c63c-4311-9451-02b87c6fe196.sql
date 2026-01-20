-- Update function to copy frequency from standards table
CREATE OR REPLACE FUNCTION public.create_organization_standards_for_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert organization_standards for all existing standards with their default frequency
  INSERT INTO public.organization_standards (organization_id, standard_id, status, frequency)
  SELECT 
    NEW.id,
    s.id,
    'pending',
    s.frequency
  FROM public.standards s
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update existing organization_standards that don't have frequency set
UPDATE public.organization_standards os
SET frequency = s.frequency
FROM public.standards s
WHERE os.standard_id = s.id
  AND os.frequency IS NULL
  AND s.frequency IS NOT NULL;