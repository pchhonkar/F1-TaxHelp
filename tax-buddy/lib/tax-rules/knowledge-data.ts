/**
 * Knowledge base configuration and hardcoded chunks for RAG.
 * PDF documents in Data/ folder are parsed and seeded separately.
 */

export type ChunkCategory = 'treaty' | 'fica' | 'forms' | 'residency' | 'income' | 'deadlines' | 'general';

/** Mapping of Data/ PDF filenames to source display name and category */
export const PDF_SOURCE_MAP: Record<string, { source: string; category: ChunkCategory }> = {
  'p519.pdf': { source: 'IRS Publication 519', category: 'general' },
  'p901.pdf': { source: 'IRS Publication 901', category: 'treaty' },
  'p4152.pdf': { source: 'IRS Pub 4152 - VITA Guide', category: 'general' },
  'f8843.pdf': { source: 'Form 8843', category: 'forms' },
  'i1040nr.pdf': { source: 'Form 1040-NR Instructions', category: 'forms' },
  'i843.pdf': { source: 'Form 843 Instructions', category: 'fica' },
  'f8316.pdf': { source: 'Form 8316', category: 'fica' },
  'iw7.pdf': { source: 'Form W-7 ITIN Instructions', category: 'forms' },
  'india.pdf': { source: 'US-India Tax Treaty', category: 'treaty' },
  'china.pdf': { source: 'US-China Tax Treaty', category: 'treaty' },
  'germany.pdf': { source: 'US-Germany Tax Treaty', category: 'treaty' },
  'korea.pdf': { source: 'US-Korea Tax Treaty', category: 'treaty' },
  'canada.pdf': { source: 'US-Canada Tax Treaty', category: 'treaty' },
  'france.pdf': { source: 'US-France Tax Treaty', category: 'treaty' },
  'thailand.pdf': { source: 'US-Thailand Tax Treaty', category: 'treaty' },
  'philip.pdf': { source: 'US-Philippines Tax Treaty', category: 'treaty' },
  'indo.pdf': { source: 'US-Indonesia Tax Treaty', category: 'treaty' },
  'mexico.pdf': { source: 'US-Mexico Tax Treaty', category: 'treaty' },
  'japan.pdf': { source: 'US-Japan Tax Treaty', category: 'treaty' },
};

/** Hardcoded high-quality chunks (always seeded in addition to parsed PDFs) */
export const HARDCODED_CHUNKS: Array<{
  content: string;
  source: string;
  category: ChunkCategory;
}> = [
  {
    content:
      'FICA Exemption for F1 Students: F1 visa holders are exempt from FICA taxes (Social Security 6.2% + Medicare 1.45% = 7.65%) for their first 5 calendar years in the US as nonresident aliens. IRS Notice 2003-57 and Publication 519. If employer withheld FICA wrongly, file Form 843 and Form 8316 for refund. Average FICA refund: $2,000-$5,000 per year.',
    source: 'IRS Notice 2003-57 + Publication 519',
    category: 'fica',
  },
  {
    content:
      'FICA Exemption for J1 Students: J1 visa holders are exempt from FICA for their first 2 calendar years as nonresident aliens. To claim refund if wrongly withheld: file Form 843 with Form 8316.',
    source: 'IRS Publication 519',
    category: 'fica',
  },
  {
    content:
      'Form 8843: REQUIRED for ALL F1/J1 visa holders who were in the US for any part of the year, even with zero income. Deadline June 15. Failure to file can affect visa status and future green card applications. Students with no income file ONLY Form 8843.',
    source: 'IRS Form 8843 Instructions',
    category: 'forms',
  },
  {
    content:
      'Substantial Presence Test: F1 students are exempt from counting days for 5 calendar years; J1 for 2 years. Most F1/J1 students file as NONRESIDENT ALIENS on Form 1040-NR, NOT Form 1040.',
    source: 'IRS Publication 519',
    category: 'residency',
  },
  {
    content:
      'India-US Tax Treaty Article 21: Students from India can exempt scholarship/fellowship income. Wages exempt up to $10,000/year for first 2 years. File Form 8833 with 1040-NR to claim.',
    source: 'US-India Tax Treaty Article 21',
    category: 'treaty',
  },
  {
    content:
      'China-US Tax Treaty Article 20: Students from China can exclude wages from US tax for 5 years. Scholarships fully exempt. One of the broadest student treaty exemptions.',
    source: 'US-China Tax Treaty Article 20',
    category: 'treaty',
  },
  {
    content:
      'Germany Article 20: Students exempt on scholarship. Wages exempt up to $9,000/year for 4 years. Korea Article 21: Wages exempt up to $2,000/year for 5 years.',
    source: 'IRS Publication 901',
    category: 'treaty',
  },
  {
    content:
      'Scholarship taxability: Amount for tuition and required fees = tax-free. Room, board, stipend = taxable. University reports taxable amounts on Form 1042-S. Many treaties exempt all scholarship — check your country.',
    source: 'IRS Publication 519',
    category: 'income',
  },
  {
    content:
      'Tax deadlines: Form 8843 only (no income): June 15. Form 1040-NR: April 15 (or June 15 if employer withheld). Extension: Form 4868 by April 15. FICA refund claim: within 3 years of payment.',
    source: 'IRS Publication 519',
    category: 'deadlines',
  },
  {
    content:
      'Form 1040-NR: The nonresident alien income tax return. Required if you had US-source income. Due April 15 or June 15. Form W-7: Apply for ITIN if no SSN; attach to first 1040-NR.',
    source: 'IRS Forms',
    category: 'forms',
  },
];
