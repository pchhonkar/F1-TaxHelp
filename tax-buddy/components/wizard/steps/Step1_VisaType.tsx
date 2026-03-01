'use client';

import { useWizard } from '../WizardContext';
import type { VisaType } from '@/types';

const VISA_OPTIONS: {
  value: VisaType;
  label: string;
  description: string;
}[] = [
  {
    value: 'F1',
    label: 'F1',
    description: 'Student visa (full-time degree)',
  },
  {
    value: 'J1',
    label: 'J1',
    description: 'Exchange visitor / scholar',
  },
  {
    value: 'OPT',
    label: 'OPT',
    description: 'Optional Practical Training',
  },
  {
    value: 'CPT',
    label: 'CPT',
    description: 'Curricular Practical Training',
  },
  {
    value: 'H1B',
    label: 'H1B',
    description: 'Work visa',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Another visa type',
  },
];

export function Step1_VisaType() {
  const { profile, updateProfile, goNext } = useWizard();
  const selected = profile.visaType;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        What is your visa type?
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        This helps us determine your tax status and refund eligibility.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {VISA_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              updateProfile({ visaType: opt.value });
              goNext();
            }}
            className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition ${
              selected === opt.value
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {opt.label}
            </span>
            <span className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Not sure? F1 and J1 are most common for students. OPT extends F1 after graduation.
      </p>
    </div>
  );
}
