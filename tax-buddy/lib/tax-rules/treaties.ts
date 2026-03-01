/**
 * US tax treaty benefits for international students.
 * Based on IRS Publication 901 and bilateral tax treaties.
 */

export interface TreatyBenefit {
  article: string;
  /** Student wage exemption in USD per year. null = full exemption. */
  studentWageExemption: number | null;
  scholarshipExempt: boolean;
  /** Years the exemption applies */
  years: number;
  notes: string;
}

export const TREATY_BENEFITS: Record<string, TreatyBenefit> = {
  India: {
    article: 'Article 21',
    studentWageExemption: 10_000,
    scholarshipExempt: true,
    years: 2,
    notes: 'Most favorable treaty for students; wages exempt up to $10k for 2 years',
  },
  China: {
    article: 'Article 20',
    studentWageExemption: null,
    scholarshipExempt: true,
    years: 5,
    notes: 'Full wage exemption for 5 years; scholarships fully exempt',
  },
  Germany: {
    article: 'Article 20',
    studentWageExemption: 9_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $9,000/year for 4 years',
  },
  'South Korea': {
    article: 'Article 21',
    studentWageExemption: 2_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $2,000/year for 5 years',
  },
  Canada: {
    article: 'Article XX',
    studentWageExemption: null,
    scholarshipExempt: true,
    years: 5,
    notes: 'Scholarships exempt; wages may be exempt for students',
  },
  Japan: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Mexico: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $3,000/year for 4 years',
  },
  France: {
    article: 'Article 21',
    studentWageExemption: 8_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $8,000/year for 5 years',
  },
  Thailand: {
    article: 'Article 21',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Philippines: {
    article: 'Article 21',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $5,000/year for 4 years',
  },
  Indonesia: {
    article: 'Article 20',
    studentWageExemption: 2_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $2,000/year for 5 years',
  },
  Brazil: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 3,
    notes: 'Wages exempt up to $3,000/year for 3 years',
  },
  'United Kingdom': {
    article: 'Article 20',
    studentWageExemption: null,
    scholarshipExempt: true,
    years: 4,
    notes: 'Scholarships exempt; wages may qualify under student provisions',
  },
  Spain: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Italy: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Netherlands: {
    article: 'Article 20',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $3,000/year for 5 years',
  },
  Sweden: {
    article: 'Article 20',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $3,000/year for 5 years',
  },
  Australia: {
    article: 'Article 20',
    studentWageExemption: null,
    scholarshipExempt: true,
    years: 4,
    notes: 'Scholarships exempt; wages may qualify under student provisions',
  },
  Taiwan: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Vietnam: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $3,000/year for 4 years',
  },
  Pakistan: {
    article: 'Article 21',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 2,
    notes: 'Wages exempt up to $5,000/year for 2 years',
  },
  Bangladesh: {
    article: 'Article 20',
    studentWageExemption: 2_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $2,000/year for 4 years',
  },
  Nigeria: {
    article: 'Article 20',
    studentWageExemption: 2_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $2,000/year for 5 years',
  },
  Turkey: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $3,000/year for 4 years',
  },
  Iran: {
    article: 'Article 21',
    studentWageExemption: 2_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $2,000/year for 5 years',
  },
  Egypt: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $3,000/year for 5 years',
  },
  Israel: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 4,
    notes: 'Wages exempt up to $5,000/year for 4 years',
  },
  Poland: {
    article: 'Article 20',
    studentWageExemption: 5_000,
    scholarshipExempt: true,
    years: 5,
    notes: 'Wages exempt up to $5,000/year for 5 years',
  },
  Colombia: {
    article: 'Article 21',
    studentWageExemption: 3_000,
    scholarshipExempt: true,
    years: 3,
    notes: 'Wages exempt up to $3,000/year for 3 years',
  },
};

const COUNTRY_ALIASES: Record<string, string> = {
  Korea: 'South Korea',
  'Republic of Korea': 'South Korea',
  UK: 'United Kingdom',
  'Great Britain': 'United Kingdom',
};

function normalizeCountry(country: string): string {
  const trimmed = country.trim();
  return COUNTRY_ALIASES[trimmed] ?? trimmed;
}

export function getTreatyBenefit(country: string): TreatyBenefit | null {
  const key = normalizeCountry(country);
  return TREATY_BENEFITS[key] ?? null;
}

export function hasTreatyBenefit(country: string): boolean {
  return getTreatyBenefit(country) !== null;
}
