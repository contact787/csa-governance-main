-- Create announcements table
CREATE TABLE public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    content text NOT NULL,
    created_by uuid NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_global boolean NOT NULL DEFAULT false
);

-- Create table to track read announcements
CREATE TABLE public.announcement_reads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    read_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements policies
-- Users can view announcements from their organization or global ones
CREATE POLICY "Users can view relevant announcements"
ON public.announcements
FOR SELECT
USING (
    is_global = true 
    OR organization_id = get_user_organization_id(auth.uid())
);

-- Admins can create announcements for their organization
CREATE POLICY "Admins can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master_admin'))
    AND created_by = auth.uid()
    AND (
        (is_global = false AND organization_id = get_user_organization_id(auth.uid()))
        OR (is_global = true AND has_role(auth.uid(), 'master_admin'))
    )
);

-- Admins can delete their own announcements
CREATE POLICY "Admins can delete their announcements"
ON public.announcements
FOR DELETE
USING (created_by = auth.uid());

-- Announcement reads policies
-- Users can view their own reads
CREATE POLICY "Users can view their reads"
ON public.announcement_reads
FOR SELECT
USING (user_id = auth.uid());

-- Users can mark announcements as read
CREATE POLICY "Users can mark as read"
ON public.announcement_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());