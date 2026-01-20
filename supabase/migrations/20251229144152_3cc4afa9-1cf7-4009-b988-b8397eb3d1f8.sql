-- Insert Standard 3.5
INSERT INTO public.standards (
  standard_id,
  title,
  category,
  information_to_collect,
  responsible_role,
  compliance_owner,
  frequency,
  verification_method,
  evidence_examples
) VALUES (
  '3.5',
  'The governing board formally accepts the completed community assessment.',
  'Community Assessment',
  'Board minutes (motion/vote) accepting CA, Resolution (if used), Board packet, Attendance/quorum proof (optional)',
  'Executive Director',
  'Planning & Evaluation',
  'Annual',
  'Review board minutes for formal acceptance vote/motion',
  ARRAY['Board minutes with acceptance vote', 'Resolution accepting community assessment', 'Board packet with CA summary', 'Attendance records showing quorum']
);

-- Create organization_standards entries for all existing organizations for Standard 3.5
INSERT INTO public.organization_standards (organization_id, standard_id, status, frequency)
SELECT 
  o.id,
  s.id,
  'pending',
  s.frequency
FROM public.organizations o
CROSS JOIN public.standards s
WHERE s.standard_id = '3.5'
ON CONFLICT DO NOTHING;