-- Create standards table (global, shared across all organizations)
CREATE TABLE public.standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  information_to_collect TEXT,
  responsible_role TEXT,
  compliance_owner TEXT,
  frequency TEXT,
  verification_method TEXT,
  evidence_examples TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_standards table (tracks status per organization)
CREATE TABLE public.organization_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  standard_id uuid REFERENCES public.standards(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'compliant', 'not_compliant')),
  submitted_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, standard_id)
);

-- Create standard_documents table
CREATE TABLE public.standard_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_standard_id uuid REFERENCES public.organization_standards(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standards (everyone in an org can view)
CREATE POLICY "Users can view all standards"
ON public.standards
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for organization_standards
CREATE POLICY "Users can view standards in their organization"
ON public.organization_standards
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Staff can update standards in their organization"
ON public.organization_standards
FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND public.has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Compliance managers can update standards in their organization"
ON public.organization_standards
FOR UPDATE
TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND public.has_role(auth.uid(), 'compliance_manager'::app_role)
);

CREATE POLICY "Admins can manage organization standards"
ON public.organization_standards
FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for standard_documents
CREATE POLICY "Users can view documents in their organization"
ON public.standard_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_standards os
    WHERE os.id = organization_standard_id
    AND os.organization_id = public.get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Staff can insert documents in their organization"
ON public.standard_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'staff'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.organization_standards os
    WHERE os.id = organization_standard_id
    AND os.organization_id = public.get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can delete their own documents"
ON public.standard_documents
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Create storage bucket for standard documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('standard-documents', 'standard-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for standard-documents bucket
CREATE POLICY "Users can upload documents in their organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'standard-documents'
  AND public.has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Users can view documents in their organization"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'standard-documents');

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'standard-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at
CREATE TRIGGER update_organization_standards_updated_at
BEFORE UPDATE ON public.organization_standards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();