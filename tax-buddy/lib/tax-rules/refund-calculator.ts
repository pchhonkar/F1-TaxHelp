/**
 * Refund estimation logic for international students.
 * Combines treaty benefits, FICA eligibility, and form requirements.
 */

import type { UserProfile, TaxCalculation } from '@/types';
import { getTreatyBenefit } from './treaties';
import { isFICAExempt, estimateFICARefund } from './fica';

/** Estimate annual wages from profile (heuristic when not provided). */
function estimateAnnualWages(profile: Partial<UserProfile>): number {
  const types = profile.incomeTypes ?? [];
  let base = 0;
  if (types.some((t) => ['W2', '1099'].includes(t))) base += 20_000;
  if (types.some((t) => ['TA', 'RA', 'stipend', 'fellowship'].includes(t))) base += 18_000;
  if (types.some((t) => t === 'scholarship')) base += 5_000; // taxable portion estimate
  if (base === 0 && types.length === 0) return 15_000; // default assumption
  return base || 25_000;
}

/** Rough effective federal rate for low-income NRA (simplified). */
const FEDERAL_RATE_LOW = 0.1;

/**
 * Calculate estimated refund for a user profile.
 * Checks treaty benefits, FICA eligibility, and determines forms needed.
 */
export function calculateEstimatedRefund(
  profile: Partial<UserProfile>,
  options?: { annualWages?: number; federalTaxWithheld?: number }
): TaxCalculation {
  const annualWages = options?.annualWages ?? estimateAnnualWages(profile);
  const federalTaxWithheld = options?.federalTaxWithheld ?? 0;

  let federalTaxRefund = federalTaxWithheld; // start with any withheld
  let treatyBenefitAmount = 0;
  let ficaRefundAmount = 0;

  const country = profile.countryOfOrigin ?? '';
  const treaty = getTreatyBenefit(country);
  const treatyBenefit = treaty !== null;
  const treatyCountry = country || '';

  // Treaty benefit: exempt wages reduce tax
  if (treaty && treaty.years >= (profile.yearsInUS ?? 1)) {
    const exemptLimit = treaty.studentWageExemption;
    if (exemptLimit === null) {
      treatyBenefitAmount = Math.round(annualWages * FEDERAL_RATE_LOW);
    } else {
      const exemptWages = Math.min(annualWages, exemptLimit);
      treatyBenefitAmount = Math.round(exemptWages * FEDERAL_RATE_LOW);
    }
    federalTaxRefund += treatyBenefitAmount;
  }

  // FICA refund if exempt and withheld
  const ficaRefundEligible =
    (profile.ficaWithheld ?? false) &&
    isFICAExempt(profile.visaType ?? 'F1', profile.yearsInUS ?? 1);
  if (ficaRefundEligible) {
    ficaRefundAmount = estimateFICARefund(annualWages);
  }

  const estimatedRefund = federalTaxRefund + ficaRefundAmount;

  const formsNeeded = determineFormsNeeded(profile, ficaRefundEligible);

  return {
    estimatedRefund,
    treatyBenefit,
    treatyCountry,
    ficaRefundEligible,
    ficaRefundAmount,
    formsNeeded,
    federalTaxRefund: federalTaxRefund > 0 ? federalTaxRefund : undefined,
    treatyBenefitAmount: treatyBenefitAmount > 0 ? treatyBenefitAmount : undefined,
  };
}

function determineFormsNeeded(
  profile: Partial<UserProfile>,
  ficaRefundEligible: boolean
): string[] {
  const forms: string[] = [];
  const visa = (profile.visaType ?? '').toUpperCase();

  if (['F1', 'J1', 'OPT', 'CPT', 'J2'].includes(visa)) {
    forms.push('Form 8843');
  }

  const hasIncome =
    (profile.incomeTypes?.length ?? 0) > 0 ||
    (profile.scholarshipAmount ?? 0) > 0;
  if (hasIncome || visa === 'H1B') {
    forms.push('Form 1040-NR');
  }

  if (ficaRefundEligible) {
    forms.push('Form 843');
    forms.push('Form 8316');
  }

  const treaty = getTreatyBenefit(profile.countryOfOrigin ?? '');
  if (treaty) {
    forms.push('Form 8833');
  }

  return [...new Set(forms)];
}
