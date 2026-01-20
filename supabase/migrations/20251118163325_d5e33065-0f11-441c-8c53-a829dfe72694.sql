-- Function to create organization_standards for all existing standards when a new organization is created
CREATE OR REPLACE FUNCTION public.create_organization_standards_for_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert organization_standards for all existing standards
  INSERT INTO public.organization_standards (organization_id, standard_id, status)
  SELECT 
    NEW.id,
    s.id,
    'pending'
  FROM public.standards s
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run the function when a new organization is created
DROP TRIGGER IF EXISTS trigger_create_org_standards ON public.organizations;

CREATE TRIGGER trigger_create_org_standards
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.create_organization_standards_for_new_org();

-- Also create organization_standards for existing organizations that don't have them yet
INSERT INTO public.organization_standards (organization_id, standard_id, status)
SELECT 
  o.id,
  s.id,
  'pending'
FROM public.organizations o
CROSS JOIN public.standards s
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.organization_standards os 
  WHERE os.organization_id = o.id 
  AND os.standard_id = s.id
)
ON CONFLICT DO NOTHING;