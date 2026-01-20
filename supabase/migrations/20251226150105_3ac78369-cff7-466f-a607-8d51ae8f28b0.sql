-- Insert Standard 2.4 into the standards table
INSERT INTO public.standards (
  standard_id,
  title,
  category,
  frequency,
  information_to_collect,
  responsible_role,
  compliance_owner,
  verification_method,
  evidence_examples
) VALUES (
  '2.4',
  'The organization documents the number of volunteers and hours mobilized in support of its activities.',
  'community-engagement',
  'Annual',
  'The organization documents the number of volunteers and hours mobilized in support of its activities. Local control of Federal CSBG resources is predicated on regular comprehensive community assessments that take into account the breadth of community needs as well as the partners and resources available in a community to meet these needs. Regular assessment of needs and resources at the community level is the foundation of Community Action and a vital management and leadership tool that is used across the organization and utilized by the community to set the course for both CSBG and all agency resources.',
  'Volunteer Coordinator / Staff',
  'Programs / Executive Office',
  'Review volunteer sign-in sheets, hour tracking reports, and system exports',
  ARRAY['Volunteer sign-in sheets', 'Volunteer hour tracking reports', 'Volunteer role descriptions', 'Summary of volunteer contributions', 'Third-party volunteer system exports']
);

-- Create organization_standards entries for all existing organizations for the new standard 2.4
INSERT INTO public.organization_standards (organization_id, standard_id, status, frequency)
SELECT 
  o.id,
  s.id,
  'pending',
  s.frequency
FROM public.organizations o
CROSS JOIN public.standards s
WHERE s.standard_id = '2.4'
ON CONFLICT DO NOTHING;