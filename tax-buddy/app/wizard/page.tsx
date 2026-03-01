'use client';

import { WizardProvider } from '@/components/wizard/WizardContext';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { Step1_VisaType } from '@/components/wizard/steps/Step1_VisaType';
import { Step2_Country } from '@/components/wizard/steps/Step2_Country';
import { Step3_YearsInUS } from '@/components/wizard/steps/Step3_YearsInUS';
import { Step4_IncomeTypes } from '@/components/wizard/steps/Step4_IncomeTypes';
import { Step5_Employer } from '@/components/wizard/steps/Step5_Employer';
import { Step6_Education } from '@/components/wizard/steps/Step6_Education';
import { Step7_Review } from '@/components/wizard/steps/Step7_Review';
import { useWizard } from '@/components/wizard/WizardContext';
import Link from 'next/link';

const STEPS = [
  Step1_VisaType,
  Step2_Country,
  Step3_YearsInUS,
  Step4_IncomeTypes,
  Step5_Employer,
  Step6_Education,
  Step7_Review,
];

function WizardContent() {
  const { step, goPrev } = useWizard();
  const StepComponent = STEPS[step - 1];

  return (
    <WizardLayout>
      {step > 1 && (
        <button
          type="button"
          onClick={goPrev}
          className="mb-4 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back
        </button>
      )}
      <StepComponent />
    </WizardLayout>
  );
}

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
