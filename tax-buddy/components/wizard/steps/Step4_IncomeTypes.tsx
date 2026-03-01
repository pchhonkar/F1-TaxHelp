'use client';

import { useWizard } from '../WizardContext';
import type { IncomeType } from '@/types';

const INCOME_OPTIONS: { value: IncomeType; label: string }[] = [
  { value: 'W2', label: 'W-2 (regular job wages)' },
  { value: 'TA', label: 'Teaching/Research Assistantship (TA/RA stipend)' },
  { value: 'scholarship', label: 'Fellowship or Scholarship' },
  { value: '1099', label: 'Freelance / 1099 work' },
  { value: 'stipend', label: 'Stipend (other)' },
  { value: 'RA', label: 'RA stipend' },
  { value: 'fellowship', label: 'Fellowship' },
];

export function Step4_IncomeTypes() {
  const { profile, updateProfile, goNext } = useWizard();
  const selected = profile.incomeTypes ?? [];

  const toggle = (v: IncomeType) => {
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    updateProfile({ incomeTypes: next });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        What types of income did you have?
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Select all that apply. Even with no income, you may need to file Form 8843.
      </p>

      <div className="mb-6 space-y-3">
        {INCOME_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
            />
            <span className="text-zinc-800 dark:text-zinc-200">{opt.label}</span>
          </label>
        ))}

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <input
            type="checkbox"
            checked={selected.length === 0}
            onChange={() => updateProfile({ incomeTypes: [] })}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
          />
          <span className="text-zinc-800 dark:text-zinc-200">
            No income (I still need to file Form 8843!)
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={goNext}
        className="rounded-full bg-emerald-600 px-6 py-2.5 font-medium text-white"
      >
        Continue
      </button>
    </div>
  );
}
