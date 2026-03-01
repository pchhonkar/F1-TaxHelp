/**
 * PDF generation for Form 8843 worksheet and 1040-NR summary.
 * Uses pdf-lib to create printable worksheets.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { UserProfile } from '@/types';
import type { TaxCalculation } from '@/types';

/** Extended profile fields for PDF generation (optional) */
export interface PDFProfile extends Partial<UserProfile> {
  fullName?: string;
  ssnOrITIN?: string;
  dateOfEntry?: string;
  universityName?: string;
  universityAddress?: string;
  degreeProgram?: string;
  annualWages?: number;
}

function drawText(
  page: { drawText: (text: string, opts: object) => void },
  text: string,
  x: number,
  y: number,
  size: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number }
) {
  page.drawText(text.slice(0, 80), {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

function drawLabel(
  page: { drawText: (text: string, opts: object) => void },
  label: string,
  value: string,
  x: number,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>
) {
  page.drawText(label + ':', { x, y, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(value || '_________________', {
    x: x + fontBold.widthOfTextAtSize(label + ': ', 9),
    y,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Generate a Form 8843 information worksheet PDF.
 * Use this as a reference when filling the actual IRS Form 8843.
 */
export async function generateForm8843(profile: PDFProfile): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 50;

  page.drawText('Form 8843 — Information Worksheet', {
    x: 50,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 24;

  page.drawText('Use this worksheet to gather information before filling the actual IRS Form 8843.', {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  page.drawText('Part I — General Information', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  const visaLabel = profile.visaType ?? 'F1';
  drawLabel(page, '1a. Visa type and date of entry', profile.dateOfEntry || `${visaLabel} / [Enter date from I-94]`, 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '1b. Current nonimmigrant status', visaLabel, 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '2. Country of citizenship', profile.countryOfOrigin || '_________________', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '3. Name', profile.fullName || '[Enter full name]', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '4. SSN or ITIN', profile.ssnOrITIN || '[Enter if you have one]', 50, y, font, fontBold);
  y -= 24;

  page.drawText('Part III — Students', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  drawLabel(page, '9. Academic institution', profile.universityName || '[University name and address]', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '10. Program director', profile.universityAddress || '[If applicable]', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '11. Visa type (F, J, M, Q) held 2019-2024', visaLabel, 50, y, font, fontBold);
  y -= 16;

  const exemptMoreThan5 = (profile.yearsInUS ?? 1) > 5;
  drawLabel(page, '12. Exempt as student > 5 years?', exemptMoreThan5 ? 'Yes' : 'No', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, '13. Applied for permanent resident?', 'No', 50, y, font, fontBold);
  y -= 30;

  page.drawText('Tax Year: 2025  |  File by: June 15, 2026 (if filing separately)', {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}

/**
 * Generate a 1040-NR summary/worksheet PDF.
 * Helps users understand what to enter on each line of Form 1040-NR.
 */
export async function generate1040NRSummary(
  profile: PDFProfile,
  calculation: TaxCalculation
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 50;

  page.drawText('Form 1040-NR — Summary Worksheet', {
    x: 50,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 24;

  page.drawText('Use this summary when completing your Form 1040-NR (Nonresident Alien).', {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  page.drawText('Income Summary', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  const incomeTypes = profile.incomeTypes ?? [];
  const incomeStr = incomeTypes.length > 0 ? incomeTypes.join(', ') : 'No income';
  drawLabel(page, 'Income types', incomeStr, 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, 'Scholarship/fellowship', `$${(profile.scholarshipAmount ?? 0).toLocaleString()}`, 50, y, font, fontBold);
  y -= 24;

  page.drawText('Treaty & FICA', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  drawLabel(page, 'Treaty country', calculation.treatyCountry || 'None', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, 'Treaty benefit', calculation.treatyBenefit ? 'Yes' : 'No', 50, y, font, fontBold);
  y -= 16;

  drawLabel(page, 'FICA refund eligible', calculation.ficaRefundEligible ? 'Yes' : 'No', 50, y, font, fontBold);
  y -= 24;

  page.drawText('Estimated Refund', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  const total = calculation.estimatedRefund ?? 0;
  page.drawText(`Total estimated refund: $${total.toLocaleString()}`, {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.4, 0),
  });
  y -= 24;

  page.drawText('Forms You Need to File', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  for (const form of calculation.formsNeeded ?? []) {
    page.drawText('• ' + form, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
    y -= 14;
  }
  y -= 20;

  page.drawText('Deadlines: Form 1040-NR — April 15 (or June 15) | Form 8843 — June 15', {
    x: 50,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}
