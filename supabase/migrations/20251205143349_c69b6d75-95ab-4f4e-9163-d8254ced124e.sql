-- Create resources table for links and documents
CREATE TABLE public.resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('link', 'document')),
    url text NOT NULL,
    file_size bigint,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Users can view resources in their organization
CREATE POLICY "Users can view resources in their organization"
ON public.resources
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Admins can manage resources
CREATE POLICY "Admins can manage resources"
ON public.resources
FOR ALL
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for resource documents
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);

-- Storage policies for resources bucket
CREATE POLICY "Users can view resource files in their organization"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'resources' 
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can upload resource files"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'resources'
    AND has_role(auth.uid(), 'admin'::app_role)
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can delete resource files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'resources'
    AND has_role(auth.uid(), 'admin'::app_role)
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();