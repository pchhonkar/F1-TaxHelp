'use client';

import { useWizard } from '../WizardContext';

const visaType = (v?: string) => (v || 'F1').toUpperCase();
const isResidentEligible = (visa: string, years: number) => {
  if (['F1', 'OPT', 'CPT'].includes(visa)) return years > 5;
  if (['J1', 'J2'].includes(visa)) return years > 2;
  return false;
};

export function Step3_YearsInUS() {
  const { profile, updateProfile, goNext } = useWizard();
  const years = profile.yearsInUS ?? 1;
  const visa = visaType(profile.visaType);
  const residentEligible = isResidentEligible(visa, years);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        How many calendar years have you been in the USA?
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Count full calendar years since your first arrival (e.g., 2022, 2023, 2024).
      </p>

      <div className="mb-6">
        <input
          type="number"
          min={1}
          max={15}
          value={years}
          onChange={(e) =>
            updateProfile({ yearsInUS: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
          className="w-24 rounded-lg border border-zinc-300 px-4 py-3 text-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {residentEligible ? (
          <p className="text-zinc-800 dark:text-zinc-200">
            You may now qualify as a <strong>Resident Alien</strong> — this changes your filing!
          </p>
        ) : (
          <p className="text-zinc-800 dark:text-zinc-200">
            As a {visa} with {years} year{years !== 1 ? 's' : ''} in the US, you file as a{' '}
            <strong>Non-Resident Alien</strong> using Form 1040-NR.
          </p>
        )}
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
