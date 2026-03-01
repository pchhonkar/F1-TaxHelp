/**
 * FICA (Social Security + Medicare) exemption rules for international students.
 * Based on IRS Notice 2003-57 and Publication 519.
 */

/** FICA rate: 6.2% Social Security + 1.45% Medicare = 7.65% */
export const FICA_RATE = 0.0765;

/**
 * Whether a student is exempt from FICA based on visa and years in US.
 * - F1: exempt for first 5 calendar years
 * - J1: exempt for first 2 calendar years
 * - OPT (on F1): exempt during OPT if still nonresident alien (typically within 5 years)
 * - CPT (on F1): same as F1, exempt within 5 years
 * - J2: exempt for first 2 years
 * - H1B, other: NOT exempt
 */
export function isFICAExempt(visaType: string, yearsInUS: number): boolean {
  const v = visaType?.toUpperCase() ?? '';
  if (['F1', 'OPT', 'CPT'].includes(v)) {
    return yearsInUS <= 5;
  }
  if (['J1', 'J2'].includes(v)) {
    return yearsInUS <= 2;
  }
  return false;
}

/**
 * Estimate FICA refund amount based on annual wages.
 * Assumes FICA was withheld at 7.65% and student is exempt.
 */
export function estimateFICARefund(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  return Math.round(annualIncome * FICA_RATE);
}
