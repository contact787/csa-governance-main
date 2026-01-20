-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update handle_new_user to support organizations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  org_name text;
BEGIN
  -- Get organization name from metadata
  org_name := NEW.raw_user_meta_data->>'organization_name';
  
  -- If organization name is provided, create or get organization
  IF org_name IS NOT NULL AND org_name != '' THEN
    -- Try to find existing organization with same name
    SELECT id INTO org_id FROM public.organizations WHERE name = org_name LIMIT 1;
    
    -- If not found, create new organization
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name) VALUES (org_name) RETURNING id INTO org_id;
    END IF;
  END IF;
  
  -- Insert profile with organization
  INSERT INTO public.profiles (user_id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    org_id
  );
  
  -- Assign default 'admin' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;

-- RLS policies for organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Update profiles RLS policies to filter by organization
DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can view profiles in their organization"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can update profiles in their organization"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete profiles in their organization" ON public.profiles;
CREATE POLICY "Admins can delete profiles in their organization"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Add trigger for updating organizations updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();