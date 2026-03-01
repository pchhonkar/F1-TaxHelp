'use client';

import { useWizard } from '../WizardContext';
import { US_STATES } from '@/lib/constants';

export function Step6_Education() {
  const { profile, updateProfile, goNext } = useWizard();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Education expenses
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Tuition and scholarship amounts help us estimate your tax situation.
      </p>

      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tuition and fees paid ($)
          </label>
          <input
            type="number"
            min={0}
            value={profile.tuitionPaid ?? 0}
            onChange={(e) =>
              updateProfile({ tuitionPaid: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Scholarship / fellowship received ($)
          </label>
          <input
            type="number"
            min={0}
            value={profile.scholarshipAmount ?? 0}
            onChange={(e) =>
              updateProfile({ scholarshipAmount: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            State of university
          </label>
          <select
            value={profile.stateOfResidence ?? ''}
            onChange={(e) => updateProfile({ stateOfResidence: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
