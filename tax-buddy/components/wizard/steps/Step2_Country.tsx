'use client';

import { useState, useMemo } from 'react';
import { useWizard } from '../WizardContext';
import { hasTreatyBenefit } from '@/lib/tax-rules';

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China',
  'Colombia', 'Costa Rica', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt',
  'Estonia', 'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana', 'Greece',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'South Korea', 'Kuwait',
  'Lebanon', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
  'Nigeria', 'Norway', 'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia',
  'South Africa', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan',
  'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'Vietnam', 'Venezuela',
].sort();

export function Step2_Country() {
  const { profile, updateProfile, goNext } = useWizard();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(
    () =>
      COUNTRIES.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 15),
    [search]
  );

  const selected = profile.countryOfOrigin || '';
  const hasTreaty = hasTreatyBenefit(selected);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        What is your country of citizenship?
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Tax treaties between your country and the USA may reduce your taxes.
      </p>

      <div className="relative mb-6">
        <input
          type="text"
          value={search || selected}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Search countries..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {isOpen && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {filtered.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={() => {
                    updateProfile({ countryOfOrigin: c });
                    setSearch('');
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasTreaty && selected && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            Good news! {selected} has a tax treaty with the USA that may reduce your taxes.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={!selected}
        className="rounded-full bg-emerald-600 px-6 py-2.5 font-medium text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
