interface OrganizationStandard {
  status: string;
  due_date: string | null;
  frequency: string | null;
  standard: {
    standard_id: string;
    frequency: string;
  };
}

export const calculateDaysUntilDue = (orgStandard: OrganizationStandard): number | null => {
  if (orgStandard.status === "compliant") return null;
  if (!orgStandard.due_date) return null;

  const frequency = (orgStandard.frequency || orgStandard.standard.frequency || "").toLowerCase();
  if (!frequency) return null;

  // Parse date correctly in local timezone (avoid UTC conversion)
  const [year, month, day] = orgStandard.due_date.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);
  const now = new Date();

  // Normalize to start of day
  baseDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  // Frequency parser (supports all your formats)
  const getMonthsToAdd = () => {
    if (frequency.includes("monthly")) return 1;
    if (frequency.includes("quarterly") && !frequency.includes("annual")) return 3;
    if (frequency.includes("semi-annual")) return 6;
    if (frequency.includes("annual") && !frequency.includes("quarterly")) return 12;
    if (frequency.includes("triennial")) return 36;
    if (frequency.includes("every 3 years")) return 36;
    if (frequency.includes("every 5 years")) return 60;

    // fallback: try to detect number
    const match = frequency.match(/(\d+)\s*year/i);
    if (match) return parseInt(match[1], 10) * 12;

    return null;
  };

  const monthsToAdd = getMonthsToAdd();
  if (!monthsToAdd) return null;

  // Start from base date
  let nextDeadline = new Date(baseDate);

  // Add frequency periods until we reach or pass today
  while (nextDeadline.getTime() < now.getTime()) {
    nextDeadline.setMonth(nextDeadline.getMonth() + monthsToAdd);
  }

  // Calculate days diff
  const diffTime = nextDeadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
