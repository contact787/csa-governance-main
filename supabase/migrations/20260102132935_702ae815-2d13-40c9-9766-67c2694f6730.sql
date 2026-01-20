-- Create login_history table to track user logins
CREATE TABLE public.login_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_name text,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text
);

-- Create system_alerts table for admin alerts and errors
CREATE TABLE public.system_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL, -- 'error', 'warning', 'info'
  title text NOT NULL,
  message text NOT NULL,
  source text, -- 'auth', 'database', 'edge_function', etc
  user_id uuid,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- Enable RLS on both tables
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for login_history
-- Master admins can view ALL login history
CREATE POLICY "Master admins can view all login history"
ON public.login_history
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'::app_role));

-- Regular admins can only view login history of their organization
CREATE POLICY "Admins can view login history of their organization"
ON public.login_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Allow inserts from authenticated users (for logging their own logins)
CREATE POLICY "Users can insert their own login history"
ON public.login_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for system_alerts
-- Master admins can view and manage all alerts
CREATE POLICY "Master admins can manage all alerts"
ON public.system_alerts
FOR ALL
USING (has_role(auth.uid(), 'master_admin'::app_role));

-- Regular admins can view alerts related to their organization
CREATE POLICY "Admins can view alerts of their organization"
ON public.system_alerts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_organization_id ON public.login_history(organization_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_alert_type ON public.system_alerts(alert_type);