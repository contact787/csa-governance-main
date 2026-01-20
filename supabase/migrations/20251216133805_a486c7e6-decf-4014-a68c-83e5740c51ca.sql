-- Table for storing selected participation methods per organization_standard
CREATE TABLE public.participation_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_standard_id UUID NOT NULL REFERENCES public.organization_standards(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  other_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_standard_id, method_key)
);

-- Table for participation log entries
CREATE TABLE public.participation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_standard_id UUID NOT NULL REFERENCES public.organization_standards(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  end_date DATE,
  participant_count INTEGER NOT NULL DEFAULT 0,
  geography TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for evidence files linked to participation logs
CREATE TABLE public.participation_log_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participation_log_id UUID NOT NULL REFERENCES public.participation_logs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tabbed evidence uploads (by method type)
CREATE TABLE public.method_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_standard_id UUID NOT NULL REFERENCES public.organization_standards(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for secondary log entries (optional tracking)
CREATE TABLE public.secondary_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_standard_id UUID NOT NULL REFERENCES public.organization_standards(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  log_date DATE NOT NULL,
  audience TEXT,
  evidence_description TEXT,
  result TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for activity log (audit trail)
CREATE TABLE public.standard_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_standard_id UUID NOT NULL REFERENCES public.organization_standards(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Add new columns to organization_standards
ALTER TABLE public.organization_standards 
ADD COLUMN IF NOT EXISTS responsible_person_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS compliance_owner_department TEXT,
ADD COLUMN IF NOT EXISTS verification_method_notes TEXT,
ADD COLUMN IF NOT EXISTS compliance_notes TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.participation_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_log_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.method_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for participation_methods
CREATE POLICY "Users can view participation methods in their organization"
ON public.participation_methods FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_standards os
  WHERE os.id = participation_methods.organization_standard_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can manage participation methods"
ON public.participation_methods FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_standards os
    WHERE os.id = participation_methods.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- RLS Policies for participation_logs
CREATE POLICY "Users can view participation logs in their organization"
ON public.participation_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_standards os
  WHERE os.id = participation_logs.organization_standard_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can manage participation logs"
ON public.participation_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_standards os
    WHERE os.id = participation_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- RLS Policies for participation_log_evidence
CREATE POLICY "Users can view log evidence in their organization"
ON public.participation_log_evidence FOR SELECT
USING (EXISTS (
  SELECT 1 FROM participation_logs pl
  JOIN organization_standards os ON os.id = pl.organization_standard_id
  WHERE pl.id = participation_log_evidence.participation_log_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can manage log evidence"
ON public.participation_log_evidence FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM participation_logs pl
    JOIN organization_standards os ON os.id = pl.organization_standard_id
    WHERE pl.id = participation_log_evidence.participation_log_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- RLS Policies for method_evidence
CREATE POLICY "Users can view method evidence in their organization"
ON public.method_evidence FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_standards os
  WHERE os.id = method_evidence.organization_standard_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can manage method evidence"
ON public.method_evidence FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_standards os
    WHERE os.id = method_evidence.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- RLS Policies for secondary_logs
CREATE POLICY "Users can view secondary logs in their organization"
ON public.secondary_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_standards os
  WHERE os.id = secondary_logs.organization_standard_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can manage secondary logs"
ON public.secondary_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_standards os
    WHERE os.id = secondary_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- RLS Policies for standard_activity_logs
CREATE POLICY "Users can view activity logs in their organization"
ON public.standard_activity_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_standards os
  WHERE os.id = standard_activity_logs.organization_standard_id
  AND os.organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Staff can insert activity logs"
ON public.standard_activity_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_standards os
    WHERE os.id = standard_activity_logs.organization_standard_id
    AND os.organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_manager'))
);

-- Triggers for updated_at
CREATE TRIGGER update_participation_methods_updated_at
BEFORE UPDATE ON public.participation_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participation_logs_updated_at
BEFORE UPDATE ON public.participation_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secondary_logs_updated_at
BEFORE UPDATE ON public.secondary_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();