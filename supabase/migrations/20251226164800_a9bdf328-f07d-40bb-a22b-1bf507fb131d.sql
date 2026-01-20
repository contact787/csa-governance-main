-- Insert Standard 3.4 into the standards table
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
  '3.4',
  'The community assessment includes key findings on the causes and conditions of poverty and the needs of the communities assessed.',
  'community-assessment',
  'CA findings section covering causes/conditions, Needs assessment summary, Priority needs list, Data-to-finding crosswalk (optional)',
  'Planning & Evaluation Director',
  'Planning & Evaluation',
  'Annual',
  'Review CA document for findings section, verify needs are documented with supporting data',
  ARRAY['CA findings section', 'Needs assessment summary', 'Priority needs list', 'Data crosswalk document']
);