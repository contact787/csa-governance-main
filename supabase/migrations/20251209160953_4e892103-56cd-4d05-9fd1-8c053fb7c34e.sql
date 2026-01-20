-- Add guidance columns to organization_standards table
ALTER TABLE public.organization_standards
ADD COLUMN ncap_guidance_url text,
ADD COLUMN ncap_guidance_label text,
ADD COLUMN state_guidance_url text,
ADD COLUMN state_guidance_label text;