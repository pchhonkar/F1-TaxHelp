import { NextResponse } from 'next/server';
import { generateForm8843, generate1040NRSummary } from '@/lib/pdf-generator';
import type { PDFProfile } from '@/lib/pdf-generator';
import type { TaxCalculation } from '@/types';
import { calculateEstimatedRefund } from '@/lib/tax-rules';

type FormType = '8843' | '1040nr-summary';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formType, profile } = body as {
      formType: FormType;
      profile: PDFProfile;
    };

    if (!profile) {
      return NextResponse.json(
        { error: 'profile is required' },
        { status: 400 }
      );
    }

    if (!formType || !['8843', '1040nr-summary'].includes(formType)) {
      return NextResponse.json(
        { error: 'formType must be 8843 or 1040nr-summary' },
        { status: 400 }
      );
    }

    let pdfBytes: Uint8Array;

    if (formType === '8843') {
      pdfBytes = await generateForm8843(profile);
    } else {
      const calculation = calculateEstimatedRefund(profile, {
        annualWages: profile.annualWages,
      });
      pdfBytes = await generate1040NRSummary(profile, calculation);
    }

    const filename =
      formType === '8843' ? 'Form-8843-Worksheet.pdf' : 'Form-1040-NR-Summary.pdf';

    const buffer = Buffer.from(pdfBytes);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
