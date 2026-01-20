// ============================================
// CENTRALIZED STANDARD CONFIGURATIONS
// ============================================
// This file contains all standard configurations for the entire application.
// Each standard is defined with its metadata, methods, evidence tabs, and audit flags.

// ============================================
// SHARED TYPES
// ============================================

export interface StandardConfig {
  id: string;
  title: string;
  description: string;
  defaultFrequency: string;
  informationToCollect: string[];
  methods: { key: string; label: string }[];
  evidenceTabs: { key: string; label: string }[];
  auditFlags: { key: string; label: string }[];
  category: string;
  // Optional: for standards that need log entries with specific fields
  logConfig?: LogFieldConfig;
}

export interface LogFieldConfig {
  // Which fields to show in the log modal
  showEventType?: boolean;
  showParticipantCount?: boolean;
  showGeography?: boolean;
  showEndDate?: boolean;
  // Custom event types for the dropdown
  eventTypes?: string[];
  // Labels for customization
  titleLabel?: string;
  dateLabel?: string;
  eventTypeLabel?: string;
  participantCountLabel?: string;
  geographyLabel?: string;
}

// ============================================
// SHARED OPTIONS
// ============================================

export const DEPARTMENT_OPTIONS = [
  "Planning & Evaluation",
  "Programs",
  "Executive Office",
  "Finance",
  "Human Resources",
  "Community Services",
  "Other",
] as const;

export const FREQUENCY_OPTIONS = [
  "Maintain",
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Annual",
  "Every 2 Years",
  "Every 3 Years",
  "Every 5 Years",
  "Triennial",
  "Other (as needed)",
] as const;

// ============================================
// CATEGORY 1: CONSUMER INPUT & INVOLVEMENT
// ============================================

export const EVIDENCE_TABS_CATEGORY1 = [
  { key: "advisory_bodies", label: "Advisory Bodies" },
  { key: "volunteer_service", label: "Volunteer Service" },
  { key: "focus_groups", label: "Focus Groups" },
  { key: "community_forums", label: "Community Forums" },
  { key: "cna_input", label: "CNA Input" },
  { key: "strategic_planning", label: "Strategic Planning" },
  { key: "recruitment_outreach", label: "Recruitment & Outreach" },
  { key: "board_documentation", label: "Board Documentation" },
];

export const EVENT_TYPES_11 = [
  "Advisory Council Meeting",
  "Volunteer Activity",
  "Focus Group Session",
  "Community Forum",
  "CNA Survey",
  "CNA Interview",
  "Strategic Planning Session",
  "Board Meeting",
  "Outreach Event",
  "Other",
];

export const STANDARD_11_CONFIG: StandardConfig = {
  id: "1.1",
  title: "Consumer Participation in Agency Activities",
  description: "The organization demonstrates low-income individuals' participation in agency activities.",
  defaultFrequency: "Quarterly",
  category: "consumer-input",
  informationToCollect: [
    "Advisory council attendance logs",
    "Volunteer participation logs",
    "Focus group sign-in sheets",
    "Community forum attendance lists",
    "CNA participation evidence (surveys, focus groups, interviews)",
    "Strategic planning participant lists",
    "Recruitment materials targeting low-income individuals",
    "Board minutes documenting low-income involvement (if applicable)",
    "Outreach efforts (flyers, emails, social posts)",
  ],
  methods: [
    { key: "advisory_bodies", label: "Advisory Bodies" },
    { key: "volunteer_service", label: "Volunteer Service" },
    { key: "focus_groups", label: "Focus Groups" },
    { key: "community_forums", label: "Community Forums" },
    { key: "cna_input", label: "CNA Input (surveys, interviews, focus groups)" },
    { key: "strategic_planning", label: "Strategic Planning Participation" },
    { key: "board_participation", label: "Board Participation (low-income individuals themselves, not representatives)" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY1,
  auditFlags: [
    { key: "has_logs", label: "Activity logs present" },
    { key: "multiple_methods", label: "Multiple participation methods documented" },
    { key: "recent_activity", label: "Activity within last 12 months" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: true,
    showEndDate: true,
    eventTypes: EVENT_TYPES_11,
    eventTypeLabel: "Event Type",
    participantCountLabel: "# Low-Income Participants",
    geographyLabel: "Geography / Service Area",
  },
};

export const INPUT_TYPES_12 = [
  "Survey",
  "Interview",
  "Focus Group",
  "Community Forum",
  "Listening Session",
  "Other",
];

export const EVIDENCE_TABS_12 = [
  { key: "cna_cycle_documents", label: "CNA Cycle Documents" },
  { key: "surveys_instruments", label: "Surveys & Instruments" },
  { key: "interviews", label: "Interviews" },
  { key: "focus_groups", label: "Focus Groups" },
  { key: "forums_sessions", label: "Forums / Listening Sessions" },
  { key: "analysis_findings", label: "Analysis & Findings" },
  { key: "board_documentation", label: "Board Documentation" },
];

export const STANDARD_12_CONFIG: StandardConfig = {
  id: "1.2",
  title: "Low-Income Input in Community Assessment",
  description: "The organization documents that low-income individuals participated in the agency's community needs assessment.",
  defaultFrequency: "Triennial",
  category: "consumer-input",
  informationToCollect: [
    "Community Assessment (CNA) methodology section",
    "Low-income surveys/interviews/focus group notes",
    "Sign-in sheets and attendance lists",
    "CNA appendices showing low-income input analysis",
    "Summary memo linking low-income input to CNA findings",
    "Board minutes/packet acknowledging CNA review (if applicable)",
  ],
  methods: [
    { key: "surveys", label: "Surveys" },
    { key: "interviews", label: "Interviews" },
    { key: "focus_groups", label: "Focus Groups" },
    { key: "community_forums", label: "Community Forums / Listening Sessions" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_12,
  auditFlags: [
    { key: "has_methodology", label: "CNA methodology documented" },
    { key: "input_documented", label: "Low-income input documented" },
    { key: "analysis_complete", label: "Input analysis complete" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: true,
    showEndDate: true,
    eventTypes: INPUT_TYPES_12,
    eventTypeLabel: "Input Type",
    participantCountLabel: "# Participants",
    geographyLabel: "Geography / Service Area",
  },
};

export const INPUT_TYPES_13 = [
  "Policy Committee",
  "Advisory Council",
  "Strategic Planning Input",
  "Other Governing Input",
];

export const EVIDENCE_TABS_13 = [
  { key: "committee_documents", label: "Committee Documents" },
  { key: "advisory_council", label: "Advisory Council" },
  { key: "strategic_planning", label: "Strategic Planning" },
  { key: "governance_records", label: "Governance Records" },
  { key: "other", label: "Other" },
];

export const STANDARD_13_CONFIG: StandardConfig = {
  id: "1.3",
  title: "Low-Income in Strategic Planning",
  description: "The organization documents how low-income individuals participated in its most recent strategic planning process.",
  defaultFrequency: "Every 3 Years",
  category: "consumer-input",
  informationToCollect: [
    "Strategic plan methodology section",
    "Low-income participant lists/sign-in sheets",
    "Focus group notes with low-income participants",
    "Survey instruments targeting low-income communities",
    "Summary of how input was incorporated into strategic plan",
  ],
  methods: [
    { key: "policy_committee", label: "Policy Committee" },
    { key: "advisory_council", label: "Advisory Council" },
    { key: "strategic_planning", label: "Strategic Planning Input" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_13,
  auditFlags: [
    { key: "participation_documented", label: "Participation documented" },
    { key: "input_incorporated", label: "Input incorporated into plan" },
    { key: "recent_planning", label: "Strategic planning within cycle" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: true,
    showEndDate: true,
    eventTypes: INPUT_TYPES_13,
    eventTypeLabel: "Input Type",
    participantCountLabel: "# Participants",
    geographyLabel: "Geography / Service Area",
  },
};

// ============================================
// CATEGORY 2: COMMUNITY ENGAGEMENT
// ============================================

export const ACTIVITY_TYPES_21 = [
  "Partnership Meeting",
  "MOU Signing",
  "Joint Program Planning",
  "Referral Coordination",
  "Collaborative Event",
  "Board Presentation",
  "Other",
];

export const EVIDENCE_TABS_21 = [
  { key: "mous_agreements", label: "MOUs / Agreements" },
  { key: "referral_protocols", label: "Referral Protocols" },
  { key: "meeting_notes", label: "Meeting Notes" },
  { key: "joint_initiatives", label: "Joint Initiatives" },
  { key: "outcomes_results", label: "Outcomes / Results" },
];

export const STANDARD_21_CONFIG: StandardConfig = {
  id: "2.1",
  title: "Community Partnerships",
  description: "The organization has documented or demonstrated partnerships across the community, for specifically identified purposes; partnerships include other anti-poverty organizations in the area.",
  defaultFrequency: "Annual",
  category: "community-engagement",
  informationToCollect: [
    "MOUs/partnership agreements",
    "Referral protocols",
    "Joint meeting minutes",
    "Collaborative program plans",
    "Outcome summaries from partnerships",
  ],
  methods: [
    { key: "mou_agreements", label: "MOUs / Partnership Agreements" },
    { key: "referral_protocols", label: "Referral Protocols" },
    { key: "joint_meetings", label: "Joint Meetings / Convenings" },
    { key: "collaborative_programs", label: "Collaborative Programs" },
    { key: "shared_resources", label: "Shared Resources / Staff" },
    { key: "advocacy_coalitions", label: "Advocacy Coalitions" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_21,
  auditFlags: [
    { key: "partnerships_documented", label: "Partnerships documented" },
    { key: "anti_poverty_included", label: "Anti-poverty orgs included" },
    { key: "purposes_identified", label: "Purposes identified" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: true,
    showEndDate: true,
    eventTypes: ACTIVITY_TYPES_21,
    eventTypeLabel: "Activity Type",
    participantCountLabel: "# Participants",
    geographyLabel: "Partner Organizations",
  },
};

export const ACTIVITY_TYPES_22 = [
  "Sector Meeting",
  "Coalition Participation",
  "Policy Advocacy",
  "Public Testimony",
  "Community Convening",
  "Other",
];

export const EVIDENCE_TABS_22 = [
  { key: "sector_meetings", label: "Sector Meetings" },
  { key: "coalitions", label: "Coalitions" },
  { key: "advocacy", label: "Advocacy" },
  { key: "community_events", label: "Community Events" },
  { key: "other", label: "Other" },
];

export const STANDARD_22_CONFIG: StandardConfig = {
  id: "2.2",
  title: "Community Coordination",
  description: "The organization coordinates with other organizations, including state and local governments, to mobilize community resources.",
  defaultFrequency: "Annual",
  category: "community-engagement",
  informationToCollect: [
    "Sector meeting attendance",
    "Coalition participation records",
    "Resource coordination documentation",
    "Advocacy participation records",
  ],
  methods: [
    { key: "sector_meetings", label: "Sector Meetings" },
    { key: "coalition_participation", label: "Coalition Participation" },
    { key: "government_coordination", label: "Government Coordination" },
    { key: "resource_mobilization", label: "Resource Mobilization" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_22,
  auditFlags: [
    { key: "coordination_documented", label: "Coordination documented" },
    { key: "government_included", label: "Government entities included" },
    { key: "resources_mobilized", label: "Resources mobilized" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: true,
    showEndDate: true,
    eventTypes: ACTIVITY_TYPES_22,
    eventTypeLabel: "Activity Type",
    participantCountLabel: "# Participants",
    geographyLabel: "Geography / Sector",
  },
};

export const ACTIVITY_TYPES_23 = [
  "Public Awareness Campaign",
  "Media Coverage",
  "Community Newsletter",
  "Social Media Outreach",
  "Community Presentation",
  "Annual Report Distribution",
  "Other",
];

export const EVIDENCE_TABS_23 = [
  { key: "public_awareness", label: "Public Awareness" },
  { key: "media_coverage", label: "Media Coverage" },
  { key: "newsletters", label: "Newsletters" },
  { key: "social_media", label: "Social Media" },
  { key: "reports", label: "Reports" },
  { key: "other", label: "Other" },
];

export const STANDARD_23_CONFIG: StandardConfig = {
  id: "2.3",
  title: "Community Awareness",
  description: "The organization documents that it acts as a community leader and is visible in the community.",
  defaultFrequency: "Annual",
  category: "community-engagement",
  informationToCollect: [
    "Public awareness campaign materials",
    "Media coverage documentation",
    "Community newsletters",
    "Social media analytics",
    "Community presentation records",
  ],
  methods: [
    { key: "public_awareness", label: "Public Awareness Campaigns" },
    { key: "media_outreach", label: "Media Outreach" },
    { key: "community_events", label: "Community Events" },
    { key: "social_media", label: "Social Media Presence" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_23,
  auditFlags: [
    { key: "visibility_documented", label: "Community visibility documented" },
    { key: "leadership_demonstrated", label: "Leadership demonstrated" },
    { key: "outreach_ongoing", label: "Outreach ongoing" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: ACTIVITY_TYPES_23,
    eventTypeLabel: "Communication Type",
    geographyLabel: "Target Audience / Area",
  },
};

export const ACTIVITY_TYPES_24 = [
  "Volunteer Orientation",
  "Volunteer Assignment",
  "Volunteer Recognition",
  "Volunteer Training",
  "Other",
];

export const EVIDENCE_TABS_24 = [
  { key: "volunteer_program", label: "Volunteer Program" },
  { key: "recruitment", label: "Recruitment" },
  { key: "training", label: "Training" },
  { key: "recognition", label: "Recognition" },
  { key: "tracking", label: "Tracking" },
  { key: "other", label: "Other" },
];

export const STANDARD_24_CONFIG: StandardConfig = {
  id: "2.4",
  title: "Volunteer Program",
  description: "The organization maintains a volunteer program that engages community members.",
  defaultFrequency: "Annual",
  category: "community-engagement",
  informationToCollect: [
    "Volunteer program policies",
    "Volunteer tracking records",
    "Volunteer orientation materials",
    "Volunteer recognition documentation",
  ],
  methods: [
    { key: "volunteer_program", label: "Volunteer Program Management" },
    { key: "recruitment", label: "Volunteer Recruitment" },
    { key: "training", label: "Volunteer Training" },
    { key: "recognition", label: "Volunteer Recognition" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_24,
  auditFlags: [
    { key: "program_documented", label: "Program documented" },
    { key: "volunteers_engaged", label: "Volunteers engaged" },
    { key: "tracking_maintained", label: "Tracking maintained" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: true,
    showGeography: false,
    showEndDate: true,
    eventTypes: ACTIVITY_TYPES_24,
    eventTypeLabel: "Activity Type",
    participantCountLabel: "# Volunteers",
  },
};

// ============================================
// CATEGORY 3: COMMUNITY ASSESSMENT
// ============================================

export const EVIDENCE_TABS_CATEGORY3 = [
  { key: "cna_documents", label: "CNA Documents" },
  { key: "data_sources", label: "Data Sources" },
  { key: "methodology", label: "Methodology" },
  { key: "analysis", label: "Analysis" },
  { key: "board_review", label: "Board Review" },
  { key: "other", label: "Other" },
];

export const ASSESSMENT_TYPES_31 = [
  "Community Assessment",
  "Needs Assessment Update",
  "Board Review Session",
  "Data Analysis",
  "Other",
];

export const STANDARD_31_CONFIG: StandardConfig = {
  id: "3.1",
  title: "Community Needs Assessment",
  description: "The organization conducted a community needs assessment within the past 3 years.",
  defaultFrequency: "Every 3 Years",
  category: "community-assessment",
  informationToCollect: [
    "Complete Community Needs Assessment",
    "Board minutes showing approval/acceptance",
    "Executive summary",
    "Methodology section",
  ],
  methods: [
    { key: "full_assessment", label: "Full Community Assessment" },
    { key: "update_review", label: "Assessment Update/Review" },
    { key: "board_presentation", label: "Board Presentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY3,
  auditFlags: [
    { key: "assessment_completed", label: "Assessment completed" },
    { key: "within_3_years", label: "Within 3-year cycle" },
    { key: "board_approved", label: "Board approved/accepted" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: ASSESSMENT_TYPES_31,
    eventTypeLabel: "Assessment Type",
    geographyLabel: "Version/Year",
  },
};

export const DATA_TYPES_32 = [
  "Poverty Statistics",
  "Demographic Data",
  "Economic Indicators",
  "Service Gap Analysis",
  "Other",
];

export const STANDARD_32_CONFIG: StandardConfig = {
  id: "3.2",
  title: "Poverty Data Collection",
  description: "The organization collects and analyzes data on poverty in the community.",
  defaultFrequency: "Every 3 Years",
  category: "community-assessment",
  informationToCollect: [
    "Poverty data sources",
    "Demographic analysis",
    "Economic indicators",
    "Service gap analysis",
  ],
  methods: [
    { key: "data_collection", label: "Data Collection" },
    { key: "analysis", label: "Data Analysis" },
    { key: "reporting", label: "Reporting" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY3,
  auditFlags: [
    { key: "data_collected", label: "Data collected" },
    { key: "analysis_complete", label: "Analysis complete" },
    { key: "sources_documented", label: "Sources documented" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: DATA_TYPES_32,
    eventTypeLabel: "Data Type",
    geographyLabel: "Version/Year",
  },
};

export const METHOD_TYPES_33 = [
  "Quantitative Analysis",
  "Qualitative Research",
  "Mixed Methods",
  "Secondary Data Review",
  "Other",
];

export const STANDARD_33_CONFIG: StandardConfig = {
  id: "3.3",
  title: "Assessment Methodology",
  description: "The community needs assessment used both quantitative and qualitative methods.",
  defaultFrequency: "Every 3 Years",
  category: "community-assessment",
  informationToCollect: [
    "Quantitative data sources (ACS, admin data, surveys)",
    "Qualitative sources (focus groups, interviews)",
    "Methodology describing both",
    "Analysis notes/memo",
    "CA appendices",
  ],
  methods: [
    { key: "quantitative", label: "Quantitative Methods" },
    { key: "qualitative", label: "Qualitative Methods" },
    { key: "mixed_methods", label: "Mixed Methods" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY3,
  auditFlags: [
    { key: "quantitative_used", label: "Quantitative methods used" },
    { key: "qualitative_used", label: "Qualitative methods used" },
    { key: "methodology_documented", label: "Methodology documented" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: METHOD_TYPES_33,
    eventTypeLabel: "Method Type",
    geographyLabel: "Version/Year",
  },
};

export const FINDINGS_TYPES_34 = [
  "Key Findings Report",
  "Executive Summary",
  "Presentation to Board",
  "Staff Briefing",
  "Other",
];

export const STANDARD_34_CONFIG: StandardConfig = {
  id: "3.4",
  title: "Assessment Findings",
  description: "The community needs assessment identifies the causes and conditions of poverty.",
  defaultFrequency: "Every 3 Years",
  category: "community-assessment",
  informationToCollect: [
    "CNA findings section",
    "Root cause analysis",
    "Conditions of poverty documented",
    "Priority areas identified",
  ],
  methods: [
    { key: "findings_documentation", label: "Findings Documentation" },
    { key: "root_cause_analysis", label: "Root Cause Analysis" },
    { key: "priority_setting", label: "Priority Setting" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY3,
  auditFlags: [
    { key: "causes_identified", label: "Causes of poverty identified" },
    { key: "conditions_documented", label: "Conditions documented" },
    { key: "priorities_set", label: "Priorities set" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: FINDINGS_TYPES_34,
    eventTypeLabel: "Document Type",
    geographyLabel: "Version/Year",
  },
};

export const ACCEPTANCE_TYPES_35 = [
  "Board Acceptance Vote",
  "Board Review Session",
  "Executive Committee Review",
  "Other",
];

export const STANDARD_35_CONFIG: StandardConfig = {
  id: "3.5",
  title: "Board Acceptance of Assessment",
  description: "The board accepted or reviewed the community needs assessment.",
  defaultFrequency: "Every 3 Years",
  category: "community-assessment",
  informationToCollect: [
    "Board minutes showing acceptance/review",
    "Board resolution (if applicable)",
    "Board packet with CNA",
    "Presentation materials",
  ],
  methods: [
    { key: "board_acceptance", label: "Board Acceptance" },
    { key: "board_review", label: "Board Review" },
    { key: "committee_review", label: "Committee Review" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY3,
  auditFlags: [
    { key: "board_reviewed", label: "Board reviewed" },
    { key: "acceptance_documented", label: "Acceptance documented" },
    { key: "minutes_available", label: "Minutes available" },
  ],
  logConfig: {
    showEventType: true,
    showParticipantCount: false,
    showGeography: true,
    showEndDate: true,
    eventTypes: ACCEPTANCE_TYPES_35,
    eventTypeLabel: "Action Type",
    geographyLabel: "Version/Year",
  },
};

// ============================================
// CATEGORY 4: SERVICE DELIVERY
// ============================================

export const EVIDENCE_TABS_CATEGORY4 = [
  { key: "program_documents", label: "Program Documents" },
  { key: "service_data", label: "Service Data" },
  { key: "outcomes", label: "Outcomes" },
  { key: "policies", label: "Policies" },
  { key: "other", label: "Other" },
];

export const STANDARD_41_CONFIG: StandardConfig = {
  id: "4.1",
  title: "Service Delivery System",
  description: "The organization has a systematic approach to service delivery.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Service delivery model documentation",
    "Program policies and procedures",
    "Intake and referral processes",
    "Case management protocols",
  ],
  methods: [
    { key: "delivery_model", label: "Service Delivery Model" },
    { key: "policies_procedures", label: "Policies & Procedures" },
    { key: "intake_processes", label: "Intake Processes" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "system_documented", label: "System documented" },
    { key: "policies_current", label: "Policies current" },
    { key: "processes_followed", label: "Processes followed" },
  ],
};

export const STANDARD_42_CONFIG: StandardConfig = {
  id: "4.2",
  title: "Linkages to Fill Gaps",
  description: "The organization has linkages to fill service gaps identified in the assessment.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Referral network documentation",
    "Partnership agreements",
    "Gap analysis and response",
  ],
  methods: [
    { key: "referral_network", label: "Referral Network" },
    { key: "partnerships", label: "Partnerships" },
    { key: "gap_response", label: "Gap Response" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "linkages_documented", label: "Linkages documented" },
    { key: "gaps_addressed", label: "Gaps addressed" },
    { key: "referrals_tracked", label: "Referrals tracked" },
  ],
};

export const STANDARD_43_CONFIG: StandardConfig = {
  id: "4.3",
  title: "Service Delivery Based on Assessment",
  description: "The organization's service delivery is based on the community needs assessment.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Service alignment documentation",
    "CNA to service crosswalk",
    "Program justification memos",
  ],
  methods: [
    { key: "alignment_review", label: "Alignment Review" },
    { key: "crosswalk", label: "CNA-Service Crosswalk" },
    { key: "justification", label: "Program Justification" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "alignment_documented", label: "Alignment documented" },
    { key: "cna_linked", label: "CNA linked to services" },
    { key: "justification_clear", label: "Justification clear" },
  ],
};

export const STANDARD_44_CONFIG: StandardConfig = {
  id: "4.4",
  title: "Customer Satisfaction Process",
  description: "The organization has a process for collecting customer satisfaction data.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Customer satisfaction surveys",
    "Feedback collection process",
    "Analysis and response documentation",
  ],
  methods: [
    { key: "surveys", label: "Surveys" },
    { key: "feedback_collection", label: "Feedback Collection" },
    { key: "analysis", label: "Analysis Process" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "process_exists", label: "Process exists" },
    { key: "data_collected", label: "Data collected" },
    { key: "analysis_completed", label: "Analysis completed" },
  ],
};

export const STANDARD_45_CONFIG: StandardConfig = {
  id: "4.5",
  title: "Customer Feedback to Board",
  description: "Customer satisfaction data is provided to the governing board.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Board reports on customer feedback",
    "Minutes showing presentation",
    "Action items from feedback",
  ],
  methods: [
    { key: "board_reporting", label: "Board Reporting" },
    { key: "action_planning", label: "Action Planning" },
    { key: "follow_up", label: "Follow-up" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "board_received", label: "Board received data" },
    { key: "actions_taken", label: "Actions taken" },
    { key: "follow_up_documented", label: "Follow-up documented" },
  ],
};

export const STANDARD_46_CONFIG: StandardConfig = {
  id: "4.6",
  title: "Service Response to Feedback",
  description: "The organization uses customer feedback to improve services.",
  defaultFrequency: "Annual",
  category: "organizational-leadership",
  informationToCollect: [
    "Improvement documentation",
    "Before/after comparisons",
    "Implementation records",
  ],
  methods: [
    { key: "improvement_tracking", label: "Improvement Tracking" },
    { key: "implementation", label: "Implementation" },
    { key: "evaluation", label: "Evaluation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY4,
  auditFlags: [
    { key: "feedback_used", label: "Feedback used" },
    { key: "improvements_made", label: "Improvements made" },
    { key: "results_documented", label: "Results documented" },
  ],
};

// ============================================
// CATEGORY 5: BOARD GOVERNANCE
// ============================================

export const EVIDENCE_TABS_CATEGORY5 = [
  { key: "policies_bylaws", label: "Policies / Bylaws" },
  { key: "rosters_trackers", label: "Rosters / Trackers" },
  { key: "minutes_packets", label: "Minutes / Board Packets" },
  { key: "forms_signatures", label: "Forms / Signatures" },
  { key: "training_orientation", label: "Training / Orientation Evidence" },
  { key: "other", label: "Other" },
];

export const STANDARD_51_CONFIG: StandardConfig = {
  id: "5.1",
  title: "Board Structure CSBG Compliance",
  description: "The organization's governing board is structured in compliance with the CSBG Act.",
  defaultFrequency: "Maintain",
  category: "board-governance",
  informationToCollect: [
    "Board roster with seat types",
    "Bylaws showing tripartite structure",
    "Member eligibility documentation",
    "Seat certifications/attestations",
  ],
  methods: [
    { key: "roster_review", label: "Board Roster Review" },
    { key: "bylaws_verification", label: "Bylaws Verification" },
    { key: "eligibility_documentation", label: "Eligibility Documentation" },
    { key: "tripartite_compliance", label: "Tripartite Compliance Check" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "roster_current", label: "Board roster current and complete" },
    { key: "tripartite_documented", label: "Tripartite structure documented" },
    { key: "eligibility_verified", label: "Member eligibility verified" },
  ],
};

export const STANDARD_52_CONFIG: StandardConfig = {
  id: "5.2",
  title: "Democratic Selection Process",
  description: "The organization's governing board has written procedures that document a democratic selection process for low-income board members.",
  defaultFrequency: "Maintain",
  category: "board-governance",
  informationToCollect: [
    "Democratic selection procedures",
    "Election notices/outreach",
    "Ballots/sign-in sheets",
    "Minutes documenting selection",
    "Rationale for representativeness",
  ],
  methods: [
    { key: "procedures_review", label: "Selection Procedures Review" },
    { key: "election_documentation", label: "Election Documentation" },
    { key: "outreach_evidence", label: "Outreach Evidence" },
    { key: "minutes_review", label: "Minutes Review" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "procedures_documented", label: "Selection procedures documented" },
    { key: "democratic_process", label: "Democratic process followed" },
    { key: "low_income_representation", label: "Low-income representation verified" },
  ],
};

export const STANDARD_53_CONFIG: StandardConfig = {
  id: "5.3",
  title: "Bylaws Attorney Review",
  description: "The organization's bylaws have been reviewed by an attorney within the past 5 years.",
  defaultFrequency: "Every 5 Years",
  category: "board-governance",
  informationToCollect: [
    "Bylaws/governing documents",
    "Attorney review letter/invoice",
    "Board minutes acknowledging review",
    "Updated bylaws version history",
  ],
  methods: [
    { key: "attorney_review", label: "Attorney Review Completion" },
    { key: "board_acknowledgment", label: "Board Acknowledgment" },
    { key: "version_tracking", label: "Version Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "review_within_5years", label: "Attorney review within 5 years" },
    { key: "documentation_complete", label: "Review documentation complete" },
    { key: "board_acknowledged", label: "Board acknowledged review" },
  ],
};

export const STANDARD_54_CONFIG: StandardConfig = {
  id: "5.4",
  title: "Bylaws Distribution",
  description: "The organization documents that each governing board member has received a copy of the bylaws within the past 2 years.",
  defaultFrequency: "Every 2 Years",
  category: "board-governance",
  informationToCollect: [
    "Roster and distribution log",
    "Signed acknowledgments (email or form)",
    "Orientation checklist",
    "Board packet indicating bylaws provided",
  ],
  methods: [
    { key: "distribution_tracking", label: "Distribution Tracking" },
    { key: "acknowledgment_collection", label: "Acknowledgment Collection" },
    { key: "orientation_verification", label: "Orientation Verification" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "all_members_received", label: "All members received bylaws" },
    { key: "acknowledgments_signed", label: "Acknowledgments signed" },
    { key: "within_2years", label: "Distribution within 2 years" },
  ],
};

export const STANDARD_55_CONFIG: StandardConfig = {
  id: "5.5",
  title: "Meeting Frequency and Quorum",
  description: "The organization's governing board meets in accordance with the frequency and quorum requirements and fills board vacancies as set out in its bylaws.",
  defaultFrequency: "Other (as needed)",
  category: "board-governance",
  informationToCollect: [
    "Meeting calendar",
    "Minutes showing quorum",
    "Attendance logs",
    "Vacancy fill documentation",
    "Bylaws (frequency/quorum clauses)",
  ],
  methods: [
    { key: "meeting_tracking", label: "Meeting Tracking" },
    { key: "quorum_verification", label: "Quorum Verification" },
    { key: "attendance_monitoring", label: "Attendance Monitoring" },
    { key: "vacancy_management", label: "Vacancy Management" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "meetings_held", label: "Required meetings held" },
    { key: "quorum_met", label: "Quorum requirements met" },
    { key: "vacancies_filled", label: "Vacancies filled per bylaws" },
  ],
};

export const STANDARD_56_CONFIG: StandardConfig = {
  id: "5.6",
  title: "Conflict of Interest Policy",
  description: "Each governing board member has signed a conflict of interest policy within the past 2 years.",
  defaultFrequency: "Every 2 Years",
  category: "board-governance",
  informationToCollect: [
    "Conflict of interest policy",
    "Signed COI forms",
    "COI tracking spreadsheet/export",
  ],
  methods: [
    { key: "policy_maintenance", label: "Policy Maintenance" },
    { key: "signature_collection", label: "Signature Collection" },
    { key: "tracking_system", label: "Tracking System" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "policy_current", label: "COI policy current" },
    { key: "all_signed", label: "All members signed" },
    { key: "within_2years", label: "Signatures within 2 years" },
  ],
};

export const STANDARD_57_CONFIG: StandardConfig = {
  id: "5.7",
  title: "Board Orientation",
  description: "The organization has a process to provide a structured orientation for governing board members within 6 months of being seated.",
  defaultFrequency: "Other (as needed)",
  category: "board-governance",
  informationToCollect: [
    "Orientation agenda/materials",
    "Attendance list",
    "New member onboarding checklist",
    "Minutes noting orientation (optional)",
  ],
  methods: [
    { key: "orientation_program", label: "Orientation Program" },
    { key: "materials_provision", label: "Materials Provision" },
    { key: "attendance_tracking", label: "Attendance Tracking" },
    { key: "completion_verification", label: "Completion Verification" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "process_documented", label: "Orientation process documented" },
    { key: "new_members_oriented", label: "New members oriented within 6 months" },
    { key: "materials_provided", label: "Materials provided" },
  ],
};

export const STANDARD_58_CONFIG: StandardConfig = {
  id: "5.8",
  title: "Board Training",
  description: "Governing board members have been provided with training on their duties and responsibilities within the past 2 years.",
  defaultFrequency: "Every 2 Years",
  category: "board-governance",
  informationToCollect: [
    "Training agendas",
    "Attendee list",
    "Board minutes noting training",
    "Certificates/webinar confirmations",
  ],
  methods: [
    { key: "training_provision", label: "Training Provision" },
    { key: "attendance_documentation", label: "Attendance Documentation" },
    { key: "completion_tracking", label: "Completion Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "training_provided", label: "Training provided within 2 years" },
    { key: "all_members_trained", label: "All members trained" },
    { key: "documentation_complete", label: "Training documentation complete" },
  ],
};

export const STANDARD_59_CONFIG: StandardConfig = {
  id: "5.9",
  title: "Programmatic Reports",
  description: "The organization's governing board receives programmatic reports at each regular board meeting.",
  defaultFrequency: "Other (as needed)",
  category: "board-governance",
  informationToCollect: [
    "Programmatic reports/dashboards",
    "Board packet materials",
    "Minutes reflecting reports received",
    "Presentation decks (optional)",
  ],
  methods: [
    { key: "report_preparation", label: "Report Preparation" },
    { key: "board_presentation", label: "Board Presentation" },
    { key: "minutes_documentation", label: "Minutes Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY5,
  auditFlags: [
    { key: "reports_provided", label: "Reports provided at each meeting" },
    { key: "minutes_document", label: "Minutes document receipt" },
    { key: "reports_comprehensive", label: "Reports comprehensive" },
  ],
};

// ============================================
// CATEGORY 6: STRATEGIC PLANNING
// ============================================

export const EVIDENCE_TABS_CATEGORY6 = [
  { key: "strategic_plan", label: "Strategic Plan" },
  { key: "goals_objectives", label: "Goals & Objectives" },
  { key: "implementation", label: "Implementation" },
  { key: "progress_reports", label: "Progress Reports" },
  { key: "board_review", label: "Board Review" },
  { key: "other", label: "Other" },
];

export const STANDARD_61_CONFIG: StandardConfig = {
  id: "6.1",
  title: "Strategic Plan Exists",
  description: "The organization has a strategic plan or agency-wide service plan in place.",
  defaultFrequency: "Every 3 Years",
  category: "strategic-planning",
  informationToCollect: [
    "Current strategic plan",
    "Board approval documentation",
    "Implementation timeline",
  ],
  methods: [
    { key: "plan_development", label: "Plan Development" },
    { key: "board_approval", label: "Board Approval" },
    { key: "implementation_planning", label: "Implementation Planning" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY6,
  auditFlags: [
    { key: "plan_exists", label: "Strategic plan exists" },
    { key: "current_plan", label: "Plan is current" },
    { key: "board_approved", label: "Board approved" },
  ],
};

export const STANDARD_62_CONFIG: StandardConfig = {
  id: "6.2",
  title: "Plan Based on Assessment",
  description: "The strategic plan is based on the community needs assessment.",
  defaultFrequency: "Every 3 Years",
  category: "strategic-planning",
  informationToCollect: [
    "Strategic plan showing CNA linkage",
    "CNA-to-strategy crosswalk",
    "Priority alignment documentation",
  ],
  methods: [
    { key: "cna_alignment", label: "CNA Alignment" },
    { key: "priority_setting", label: "Priority Setting" },
    { key: "crosswalk_development", label: "Crosswalk Development" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY6,
  auditFlags: [
    { key: "cna_linked", label: "Plan linked to CNA" },
    { key: "priorities_aligned", label: "Priorities aligned" },
    { key: "documentation_complete", label: "Documentation complete" },
  ],
};

export const STANDARD_63_CONFIG: StandardConfig = {
  id: "6.3",
  title: "Plan Includes Anti-Poverty Goals",
  description: "The strategic plan addresses the reduction of poverty and revitalization of low-income communities.",
  defaultFrequency: "Every 3 Years",
  category: "strategic-planning",
  informationToCollect: [
    "Anti-poverty goals in strategic plan",
    "Community revitalization objectives",
    "Outcome measures",
  ],
  methods: [
    { key: "goal_review", label: "Goal Review" },
    { key: "outcome_planning", label: "Outcome Planning" },
    { key: "community_focus", label: "Community Focus" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY6,
  auditFlags: [
    { key: "anti_poverty_goals", label: "Anti-poverty goals included" },
    { key: "revitalization_addressed", label: "Revitalization addressed" },
    { key: "outcomes_defined", label: "Outcomes defined" },
  ],
};

export const STANDARD_64_CONFIG: StandardConfig = {
  id: "6.4",
  title: "Plan Progress Monitored",
  description: "The board reviews strategic plan progress at least annually.",
  defaultFrequency: "Annual",
  category: "strategic-planning",
  informationToCollect: [
    "Progress reports",
    "Board minutes showing review",
    "Status updates",
  ],
  methods: [
    { key: "progress_reporting", label: "Progress Reporting" },
    { key: "board_review", label: "Board Review" },
    { key: "status_tracking", label: "Status Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY6,
  auditFlags: [
    { key: "progress_reported", label: "Progress reported" },
    { key: "board_reviewed", label: "Board reviewed" },
    { key: "annual_review", label: "Annual review completed" },
  ],
};

export const STANDARD_65_CONFIG: StandardConfig = {
  id: "6.5",
  title: "Plan Adjustments Made",
  description: "The organization adjusts the strategic plan based on progress and changing conditions.",
  defaultFrequency: "Annual",
  category: "strategic-planning",
  informationToCollect: [
    "Plan revision documentation",
    "Board approval of changes",
    "Rationale for adjustments",
  ],
  methods: [
    { key: "plan_review", label: "Plan Review" },
    { key: "adjustment_process", label: "Adjustment Process" },
    { key: "board_approval", label: "Board Approval" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY6,
  auditFlags: [
    { key: "adjustments_made", label: "Adjustments made as needed" },
    { key: "board_approved", label: "Board approved changes" },
    { key: "rationale_documented", label: "Rationale documented" },
  ],
};

// ============================================
// CATEGORY 7: HUMAN RESOURCES
// ============================================

export const EVIDENCE_TABS_CATEGORY7 = [
  { key: "policies", label: "Policies" },
  { key: "handbooks", label: "Handbooks" },
  { key: "job_descriptions", label: "Job Descriptions" },
  { key: "evaluations", label: "Evaluations" },
  { key: "training", label: "Training" },
  { key: "other", label: "Other" },
];

export const STANDARD_71_CONFIG: StandardConfig = {
  id: "7.1",
  title: "Personnel Policies",
  description: "The organization has written personnel policies approved by the board.",
  defaultFrequency: "Every 2 Years",
  category: "human-resource-management",
  informationToCollect: [
    "Personnel policies manual",
    "Board approval documentation",
    "Policy revision history",
  ],
  methods: [
    { key: "policy_review", label: "Policy Review" },
    { key: "board_approval", label: "Board Approval" },
    { key: "distribution", label: "Distribution to Staff" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "policies_exist", label: "Personnel policies exist" },
    { key: "board_approved", label: "Board approved" },
    { key: "current_version", label: "Current version maintained" },
  ],
};

export const STANDARD_72_CONFIG: StandardConfig = {
  id: "7.2",
  title: "Employee Handbook",
  description: "Employees have received a copy of the personnel policies or employee handbook.",
  defaultFrequency: "Other (as needed)",
  category: "human-resource-management",
  informationToCollect: [
    "Employee acknowledgment forms",
    "Distribution records",
    "Handbook version tracking",
  ],
  methods: [
    { key: "distribution_tracking", label: "Distribution Tracking" },
    { key: "acknowledgment_collection", label: "Acknowledgment Collection" },
    { key: "version_management", label: "Version Management" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "all_received", label: "All employees received handbook" },
    { key: "acknowledgments_signed", label: "Acknowledgments signed" },
    { key: "current_version", label: "Current version distributed" },
  ],
};

export const STANDARD_73_CONFIG: StandardConfig = {
  id: "7.3",
  title: "Job Descriptions",
  description: "The organization has written job descriptions for all positions.",
  defaultFrequency: "Maintain",
  category: "human-resource-management",
  informationToCollect: [
    "Job descriptions for all positions",
    "Organization chart",
    "Position classification records",
  ],
  methods: [
    { key: "job_description_review", label: "Job Description Review" },
    { key: "org_chart_maintenance", label: "Org Chart Maintenance" },
    { key: "classification_review", label: "Classification Review" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "all_positions_covered", label: "All positions have descriptions" },
    { key: "descriptions_current", label: "Descriptions current" },
    { key: "org_chart_updated", label: "Org chart updated" },
  ],
};

export const STANDARD_74_CONFIG: StandardConfig = {
  id: "7.4",
  title: "CEO Performance Evaluation",
  description: "The board conducts an annual performance appraisal of the CEO/Executive Director.",
  defaultFrequency: "Annual",
  category: "human-resource-management",
  informationToCollect: [
    "CEO evaluation form/process",
    "Board minutes noting evaluation",
    "Goal setting documentation",
  ],
  methods: [
    { key: "evaluation_process", label: "Evaluation Process" },
    { key: "goal_setting", label: "Goal Setting" },
    { key: "board_review", label: "Board Review" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "evaluation_completed", label: "Evaluation completed annually" },
    { key: "board_conducted", label: "Board conducted evaluation" },
    { key: "goals_set", label: "Goals set for next period" },
  ],
};

export const STANDARD_75_CONFIG: StandardConfig = {
  id: "7.5",
  title: "Staff Performance Evaluations",
  description: "The organization conducts annual performance evaluations for all staff.",
  defaultFrequency: "Annual",
  category: "human-resource-management",
  informationToCollect: [
    "Evaluation policy/process",
    "Completion tracking records",
    "Sample evaluation forms",
  ],
  methods: [
    { key: "evaluation_process", label: "Evaluation Process" },
    { key: "completion_tracking", label: "Completion Tracking" },
    { key: "supervisor_training", label: "Supervisor Training" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "evaluations_completed", label: "All evaluations completed" },
    { key: "annual_cycle", label: "Annual cycle maintained" },
    { key: "documentation_complete", label: "Documentation complete" },
  ],
};

export const STANDARD_76_CONFIG: StandardConfig = {
  id: "7.6",
  title: "Staff Training and Development",
  description: "The organization provides staff training and professional development opportunities.",
  defaultFrequency: "Annual",
  category: "human-resource-management",
  informationToCollect: [
    "Training records",
    "Professional development plans",
    "Training budget",
  ],
  methods: [
    { key: "training_provision", label: "Training Provision" },
    { key: "development_planning", label: "Development Planning" },
    { key: "tracking", label: "Training Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "training_provided", label: "Training provided" },
    { key: "development_available", label: "Development opportunities available" },
    { key: "records_maintained", label: "Records maintained" },
  ],
};

export const STANDARD_77_CONFIG: StandardConfig = {
  id: "7.7",
  title: "Nondiscrimination Policy",
  description: "The organization has a nondiscrimination policy in place.",
  defaultFrequency: "Maintain",
  category: "human-resource-management",
  informationToCollect: [
    "Nondiscrimination policy",
    "EEO statement",
    "Complaint procedures",
  ],
  methods: [
    { key: "policy_maintenance", label: "Policy Maintenance" },
    { key: "posting", label: "Policy Posting" },
    { key: "training", label: "Staff Training" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "policy_exists", label: "Policy exists" },
    { key: "policy_posted", label: "Policy posted" },
    { key: "complaint_process", label: "Complaint process documented" },
  ],
};

export const STANDARD_78_CONFIG: StandardConfig = {
  id: "7.8",
  title: "Whistleblower Policy",
  description: "The organization has a whistleblower protection policy.",
  defaultFrequency: "Maintain",
  category: "human-resource-management",
  informationToCollect: [
    "Whistleblower policy",
    "Reporting procedures",
    "Staff acknowledgment",
  ],
  methods: [
    { key: "policy_maintenance", label: "Policy Maintenance" },
    { key: "distribution", label: "Distribution" },
    { key: "training", label: "Staff Training" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "policy_exists", label: "Policy exists" },
    { key: "procedures_clear", label: "Procedures clear" },
    { key: "staff_aware", label: "Staff aware of policy" },
  ],
};

export const STANDARD_79_CONFIG: StandardConfig = {
  id: "7.9",
  title: "Succession Planning",
  description: "The organization has a succession plan for key positions.",
  defaultFrequency: "Annual",
  category: "human-resource-management",
  informationToCollect: [
    "Succession plan",
    "Key position identification",
    "Development plans for successors",
  ],
  methods: [
    { key: "plan_development", label: "Plan Development" },
    { key: "position_analysis", label: "Key Position Analysis" },
    { key: "successor_development", label: "Successor Development" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY7,
  auditFlags: [
    { key: "plan_exists", label: "Succession plan exists" },
    { key: "key_positions_identified", label: "Key positions identified" },
    { key: "successors_developing", label: "Successors developing" },
  ],
};

// ============================================
// CATEGORY 8: FINANCIAL OPERATIONS
// ============================================

export const EVIDENCE_TABS_CATEGORY8 = [
  { key: "audits_financial", label: "Audits & Financial Statements" },
  { key: "board_actions", label: "Board Actions" },
  { key: "policies", label: "Policies" },
  { key: "filings_confirmations", label: "Filings & Confirmations" },
  { key: "budgets_reports", label: "Budgets & Reports" },
  { key: "procurement_bids", label: "Procurement / Bids" },
  { key: "other", label: "Other" },
];

export const STANDARD_81_CONFIG: StandardConfig = {
  id: "8.1",
  title: "Annual Audit",
  description: "The organization's annual audit (or audited financial statements) is completed by a Certified Public Accountant on time.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Annual audit/audited financial statements",
    "CPA engagement letter",
    "Submission confirmation (if applicable)",
    "Management letter",
  ],
  methods: [
    { key: "audit_completion", label: "Audit Completion" },
    { key: "cpa_engagement", label: "CPA Engagement" },
    { key: "timely_submission", label: "Timely Submission" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "audit_completed", label: "Annual audit completed" },
    { key: "cpa_certified", label: "CPA certified" },
    { key: "on_time", label: "Completed on time" },
  ],
};

export const STANDARD_82_CONFIG: StandardConfig = {
  id: "8.2",
  title: "Prior Audit Findings Addressed",
  description: "All findings from the prior year's annual audit have been assessed by the organization and addressed where the governing board has deemed it appropriate.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Prior audit findings list",
    "Corrective action plans",
    "Board minutes noting assessment",
    "Closure evidence",
  ],
  methods: [
    { key: "findings_review", label: "Findings Review" },
    { key: "corrective_actions", label: "Corrective Actions" },
    { key: "board_assessment", label: "Board Assessment" },
    { key: "closure_tracking", label: "Closure Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "findings_assessed", label: "Findings assessed" },
    { key: "actions_taken", label: "Corrective actions taken" },
    { key: "board_reviewed", label: "Board reviewed findings" },
  ],
};

export const STANDARD_83_CONFIG: StandardConfig = {
  id: "8.3",
  title: "Auditor Presents to Board",
  description: "The organization's auditor presents the audit to the governing board.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Board agenda item",
    "Auditor presentation slides",
    "Minutes documenting presentation",
    "Attendance list (optional)",
  ],
  methods: [
    { key: "presentation_scheduling", label: "Presentation Scheduling" },
    { key: "auditor_attendance", label: "Auditor Attendance" },
    { key: "documentation", label: "Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "presentation_made", label: "Auditor presented to board" },
    { key: "minutes_document", label: "Minutes document presentation" },
    { key: "annual_occurrence", label: "Occurs annually" },
  ],
};

export const STANDARD_84_CONFIG: StandardConfig = {
  id: "8.4",
  title: "Board Accepts Audit",
  description: "The governing board formally receives and accepts the audit.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Board motion/vote minutes accepting audit",
    "Resolution (if used)",
    "Audit report included in packet",
  ],
  methods: [
    { key: "formal_acceptance", label: "Formal Acceptance Process" },
    { key: "board_motion", label: "Board Motion/Vote" },
    { key: "documentation", label: "Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "formally_accepted", label: "Audit formally accepted" },
    { key: "motion_recorded", label: "Motion/vote recorded" },
    { key: "documentation_complete", label: "Documentation complete" },
  ],
};

export const STANDARD_85_CONFIG: StandardConfig = {
  id: "8.5",
  title: "Audit Bid Solicitation",
  description: "The organization has solicited bids for its audit within the past 5 years.",
  defaultFrequency: "Every 5 Years",
  category: "financial-operations-oversight",
  informationToCollect: [
    "RFP/bid solicitation",
    "Bid responses",
    "Selection memo",
    "Board minutes (if involved)",
  ],
  methods: [
    { key: "rfp_process", label: "RFP Process" },
    { key: "bid_evaluation", label: "Bid Evaluation" },
    { key: "selection_documentation", label: "Selection Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "bids_solicited", label: "Bids solicited within 5 years" },
    { key: "process_documented", label: "Process documented" },
    { key: "selection_justified", label: "Selection justified" },
  ],
};

export const STANDARD_86_CONFIG: StandardConfig = {
  id: "8.6",
  title: "Form 990",
  description: "The IRS Form 990 is completed annually and made available to the governing board for review.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "IRS Form 990 filed copy",
    "Board packet showing availability",
    "Minutes noting review (optional)",
  ],
  methods: [
    { key: "form_completion", label: "Form 990 Completion" },
    { key: "board_availability", label: "Board Availability" },
    { key: "review_documentation", label: "Review Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "990_completed", label: "Form 990 completed annually" },
    { key: "board_access", label: "Available to board" },
    { key: "filed_on_time", label: "Filed on time" },
  ],
};

export const STANDARD_87_CONFIG: StandardConfig = {
  id: "8.7",
  title: "Financial Reports to Board",
  description: "The governing board receives financial reports at each regular meeting.",
  defaultFrequency: "Other (as needed)",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Budget vs actual (by program)",
    "Balance sheet/statement of financial position",
    "Board packet",
    "Minutes noting receipt",
  ],
  methods: [
    { key: "report_preparation", label: "Report Preparation" },
    { key: "regular_presentation", label: "Regular Presentation" },
    { key: "board_receipt", label: "Board Receipt Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "reports_provided", label: "Reports provided each meeting" },
    { key: "minutes_document", label: "Minutes document receipt" },
    { key: "reports_comprehensive", label: "Reports comprehensive" },
  ],
};

export const STANDARD_88_CONFIG: StandardConfig = {
  id: "8.8",
  title: "Payroll Withholdings",
  description: "All required filings and payments related to payroll withholdings are completed on time.",
  defaultFrequency: "Other (as needed)",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Payroll withholding filings",
    "Payment confirmations",
    "Compliance calendar",
    "Exception log (if any)",
  ],
  methods: [
    { key: "filing_compliance", label: "Filing Compliance" },
    { key: "payment_tracking", label: "Payment Tracking" },
    { key: "calendar_management", label: "Calendar Management" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "filings_timely", label: "Filings completed on time" },
    { key: "payments_timely", label: "Payments completed on time" },
    { key: "no_exceptions", label: "No compliance exceptions" },
  ],
};

export const STANDARD_89_CONFIG: StandardConfig = {
  id: "8.9",
  title: "Annual Budget Approval",
  description: "The governing board annually approves an organization-wide budget.",
  defaultFrequency: "Annual",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Organization-wide budget",
    "Board minutes approving budget",
    "Budget assumptions memo (optional)",
  ],
  methods: [
    { key: "budget_preparation", label: "Budget Preparation" },
    { key: "board_approval", label: "Board Approval" },
    { key: "documentation", label: "Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "budget_approved", label: "Budget approved annually" },
    { key: "organization_wide", label: "Budget is organization-wide" },
    { key: "board_documented", label: "Board approval documented" },
  ],
};

export const STANDARD_810_CONFIG: StandardConfig = {
  id: "8.10",
  title: "Fiscal Policies Review",
  description: "The fiscal policies have been reviewed by staff within the past 2 years, updated as necessary, with changes approved by the governing board.",
  defaultFrequency: "Every 2 Years",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Fiscal policies",
    "Staff review evidence",
    "Change log",
    "Board minutes approving changes",
  ],
  methods: [
    { key: "policy_review", label: "Policy Review" },
    { key: "staff_assessment", label: "Staff Assessment" },
    { key: "update_process", label: "Update Process" },
    { key: "board_approval", label: "Board Approval" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "reviewed_within_2years", label: "Reviewed within 2 years" },
    { key: "changes_approved", label: "Changes approved by board" },
    { key: "documentation_complete", label: "Documentation complete" },
  ],
};

export const STANDARD_811_CONFIG: StandardConfig = {
  id: "8.11",
  title: "Procurement Policy",
  description: "A written procurement policy is in place and has been reviewed by the governing board within the past 5 years.",
  defaultFrequency: "Every 5 Years",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Procurement policy",
    "Board review minutes",
    "Policy update history",
  ],
  methods: [
    { key: "policy_maintenance", label: "Policy Maintenance" },
    { key: "board_review", label: "Board Review" },
    { key: "update_tracking", label: "Update Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "policy_exists", label: "Procurement policy exists" },
    { key: "board_reviewed", label: "Board reviewed within 5 years" },
    { key: "policy_current", label: "Policy is current" },
  ],
};

export const STANDARD_812_CONFIG: StandardConfig = {
  id: "8.12",
  title: "Cost Allocation",
  description: "The organization documents how it allocates shared costs through an indirect cost rate or through a written cost allocation plan.",
  defaultFrequency: "Maintain",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Indirect cost rate agreement (if used)",
    "Cost allocation plan",
    "Allocation methodology memo",
    "Update history",
  ],
  methods: [
    { key: "rate_maintenance", label: "Indirect Cost Rate Maintenance" },
    { key: "allocation_plan", label: "Cost Allocation Plan" },
    { key: "methodology_documentation", label: "Methodology Documentation" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "methodology_documented", label: "Allocation methodology documented" },
    { key: "rate_or_plan", label: "Rate or plan in place" },
    { key: "current_documentation", label: "Documentation current" },
  ],
};

export const STANDARD_813_CONFIG: StandardConfig = {
  id: "8.13",
  title: "Record Retention Policy",
  description: "The organization has a written policy in place for record retention and destruction.",
  defaultFrequency: "Maintain",
  category: "financial-operations-oversight",
  informationToCollect: [
    "Record retention & destruction policy",
    "Retention schedule",
    "Staff notice/training (optional)",
  ],
  methods: [
    { key: "policy_maintenance", label: "Policy Maintenance" },
    { key: "schedule_development", label: "Schedule Development" },
    { key: "staff_training", label: "Staff Training" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY8,
  auditFlags: [
    { key: "policy_exists", label: "Policy exists" },
    { key: "schedule_defined", label: "Retention schedule defined" },
    { key: "staff_aware", label: "Staff aware of policy" },
  ],
};

// ============================================
// CATEGORY 9: DATA & ANALYSIS
// ============================================

export const EVIDENCE_TABS_CATEGORY9 = [
  { key: "systems_configuration", label: "Systems & Configuration" },
  { key: "data_dictionaries", label: "Data Dictionaries" },
  { key: "sample_reports", label: "Sample Reports" },
  { key: "board_review", label: "Board Review Materials" },
  { key: "submissions_confirmations", label: "Submissions & Confirmations" },
  { key: "other", label: "Other" },
];

export const STANDARD_91_CONFIG: StandardConfig = {
  id: "9.1",
  title: "Client Demographics and Services Tracking",
  description: "The organization has a system or systems in place to track and report client demographics and services customers receive.",
  defaultFrequency: "Maintain",
  category: "data-analysis",
  informationToCollect: [
    "System screenshots/data dictionary",
    "Sample demographic reports",
    "Client/service tracking exports",
    "Reporting SOP",
  ],
  methods: [
    { key: "system_maintenance", label: "System Maintenance" },
    { key: "data_collection", label: "Data Collection Processes" },
    { key: "reporting_procedures", label: "Reporting Procedures" },
    { key: "quality_assurance", label: "Quality Assurance" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY9,
  auditFlags: [
    { key: "system_exists", label: "Tracking system exists" },
    { key: "demographics_tracked", label: "Demographics tracked" },
    { key: "services_tracked", label: "Services tracked" },
  ],
};

export const STANDARD_92_CONFIG: StandardConfig = {
  id: "9.2",
  title: "Outcomes Tracking",
  description: "The organization has a system or systems in place to track family, agency, and/or community outcomes.",
  defaultFrequency: "Maintain",
  category: "data-analysis",
  informationToCollect: [
    "Outcome framework/indicators",
    "Sample outcomes reports",
    "System configuration screenshots",
    "ROMA/NPI linkage (optional)",
  ],
  methods: [
    { key: "outcome_tracking", label: "Outcome Tracking System" },
    { key: "framework_maintenance", label: "Framework Maintenance" },
    { key: "roma_alignment", label: "ROMA Alignment" },
    { key: "reporting", label: "Outcomes Reporting" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY9,
  auditFlags: [
    { key: "system_exists", label: "Outcome tracking system exists" },
    { key: "family_outcomes", label: "Family outcomes tracked" },
    { key: "community_outcomes", label: "Community outcomes tracked" },
  ],
};

export const STANDARD_93_CONFIG: StandardConfig = {
  id: "9.3",
  title: "Outcomes Analysis and Board Review",
  description: "The organization has presented to the governing board for review or action, at least within the past 12 months, an analysis of the agency's outcomes and any operational or strategic program adjustments and improvements identified as necessary.",
  defaultFrequency: "Annual",
  category: "data-analysis",
  informationToCollect: [
    "Annual outcomes analysis report",
    "Board packet/minutes showing review/action",
    "Improvement plan/adjustments log",
    "Follow-up status",
  ],
  methods: [
    { key: "analysis_preparation", label: "Analysis Preparation" },
    { key: "board_presentation", label: "Board Presentation" },
    { key: "improvement_planning", label: "Improvement Planning" },
    { key: "follow_up_tracking", label: "Follow-up Tracking" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY9,
  auditFlags: [
    { key: "analysis_completed", label: "Analysis completed within 12 months" },
    { key: "board_reviewed", label: "Board reviewed analysis" },
    { key: "improvements_identified", label: "Improvements identified" },
  ],
};

export const STANDARD_94_CONFIG: StandardConfig = {
  id: "9.4",
  title: "CSBG Information Survey",
  description: "The organization submits its annual CSBG Information Survey data report and it reflects client demographics and organization-wide outcomes.",
  defaultFrequency: "Annual",
  category: "data-analysis",
  informationToCollect: [
    "CSBG IS submission confirmation",
    "Submitted IS report",
    "Underlying data extracts",
    "Data validation notes",
  ],
  methods: [
    { key: "data_compilation", label: "Data Compilation" },
    { key: "report_submission", label: "Report Submission" },
    { key: "data_validation", label: "Data Validation" },
    { key: "quality_review", label: "Quality Review" },
    { key: "other", label: "Other" },
  ],
  evidenceTabs: EVIDENCE_TABS_CATEGORY9,
  auditFlags: [
    { key: "is_submitted", label: "CSBG IS submitted annually" },
    { key: "demographics_included", label: "Demographics reflected" },
    { key: "outcomes_included", label: "Outcomes reflected" },
  ],
};

// ============================================
// CONFIGURATION LOOKUP MAP
// ============================================

export const STANDARD_CONFIGS: Record<string, StandardConfig> = {
  "1.1": STANDARD_11_CONFIG,
  "1.2": STANDARD_12_CONFIG,
  "1.3": STANDARD_13_CONFIG,
  "2.1": STANDARD_21_CONFIG,
  "2.2": STANDARD_22_CONFIG,
  "2.3": STANDARD_23_CONFIG,
  "2.4": STANDARD_24_CONFIG,
  "3.1": STANDARD_31_CONFIG,
  "3.2": STANDARD_32_CONFIG,
  "3.3": STANDARD_33_CONFIG,
  "3.4": STANDARD_34_CONFIG,
  "3.5": STANDARD_35_CONFIG,
  "4.1": STANDARD_41_CONFIG,
  "4.2": STANDARD_42_CONFIG,
  "4.3": STANDARD_43_CONFIG,
  "4.4": STANDARD_44_CONFIG,
  "4.5": STANDARD_45_CONFIG,
  "4.6": STANDARD_46_CONFIG,
  "5.1": STANDARD_51_CONFIG,
  "5.2": STANDARD_52_CONFIG,
  "5.3": STANDARD_53_CONFIG,
  "5.4": STANDARD_54_CONFIG,
  "5.5": STANDARD_55_CONFIG,
  "5.6": STANDARD_56_CONFIG,
  "5.7": STANDARD_57_CONFIG,
  "5.8": STANDARD_58_CONFIG,
  "5.9": STANDARD_59_CONFIG,
  "6.1": STANDARD_61_CONFIG,
  "6.2": STANDARD_62_CONFIG,
  "6.3": STANDARD_63_CONFIG,
  "6.4": STANDARD_64_CONFIG,
  "6.5": STANDARD_65_CONFIG,
  "7.1": STANDARD_71_CONFIG,
  "7.2": STANDARD_72_CONFIG,
  "7.3": STANDARD_73_CONFIG,
  "7.4": STANDARD_74_CONFIG,
  "7.5": STANDARD_75_CONFIG,
  "7.6": STANDARD_76_CONFIG,
  "7.7": STANDARD_77_CONFIG,
  "7.8": STANDARD_78_CONFIG,
  "7.9": STANDARD_79_CONFIG,
  "8.1": STANDARD_81_CONFIG,
  "8.2": STANDARD_82_CONFIG,
  "8.3": STANDARD_83_CONFIG,
  "8.4": STANDARD_84_CONFIG,
  "8.5": STANDARD_85_CONFIG,
  "8.6": STANDARD_86_CONFIG,
  "8.7": STANDARD_87_CONFIG,
  "8.8": STANDARD_88_CONFIG,
  "8.9": STANDARD_89_CONFIG,
  "8.10": STANDARD_810_CONFIG,
  "8.11": STANDARD_811_CONFIG,
  "8.12": STANDARD_812_CONFIG,
  "8.13": STANDARD_813_CONFIG,
  "9.1": STANDARD_91_CONFIG,
  "9.2": STANDARD_92_CONFIG,
  "9.3": STANDARD_93_CONFIG,
  "9.4": STANDARD_94_CONFIG,
};

/**
 * Get the configuration for a specific standard by ID
 */
export function getStandardConfig(standardId: string): StandardConfig | undefined {
  return STANDARD_CONFIGS[standardId];
}

/**
 * Get all standards for a specific category
 */
export function getStandardsByCategory(category: string): StandardConfig[] {
  return Object.values(STANDARD_CONFIGS).filter((config) => config.category === category);
}
