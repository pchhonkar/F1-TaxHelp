'use client';

import { useWizard } from '../WizardContext';

export function Step5_Employer() {
  const { profile, updateProfile, goNext } = useWizard();
  const ficaWithheld = profile.ficaWithheld ?? false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Did your employer withhold Social Security and Medicare taxes?
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Check Box 4 (Social Security) and Box 6 (Medicare) on your W-2.
      </p>

      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={() => updateProfile({ ficaWithheld: true })}
          className={`flex-1 rounded-lg border-2 py-3 font-medium transition ${
            ficaWithheld
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-zinc-200 dark:border-zinc-700'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => updateProfile({ ficaWithheld: false })}
          className={`flex-1 rounded-lg border-2 py-3 font-medium transition ${
            !ficaWithheld
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-zinc-200 dark:border-zinc-700'
          }`}
        >
          No
        </button>
      </div>

      {ficaWithheld && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            You may be entitled to a FICA refund! Many international students are exempt
            from these taxes. We&apos;ll help you claim it back.
          </p>
        </div>
      )}

      {ficaWithheld && (
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Approximate annual wages (optional, for refund estimate)
          </label>
          <input
            type="number"
            min={0}
            placeholder="e.g. 35000"
            value={profile.annualWages ?? ''}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              updateProfile({ annualWages: isNaN(v) ? undefined : v });
            }}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

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
