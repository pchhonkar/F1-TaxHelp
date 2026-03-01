'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWizard } from '../WizardContext';
import { RefundCalculator } from '@/components/refund/RefundCalculator';

const PROFILE_KEY = 'taxbuddy-wizard-profile';

export function Step7_Review() {
  const { profile } = useWizard();

  useEffect(() => {
    if (typeof window !== 'undefined' && profile) {
      window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  const summary = [
    { label: 'Visa', value: profile.visaType ?? '—' },
    { label: 'Country', value: profile.countryOfOrigin || '—' },
    { label: 'Years in US', value: profile.yearsInUS ?? '—' },
    { label: 'State', value: profile.stateOfResidence || '—' },
    { label: 'Income types', value: (profile.incomeTypes ?? []).join(', ') || 'None' },
    { label: 'FICA withheld', value: profile.ficaWithheld ? 'Yes' : 'No' },
    { label: 'Tuition paid', value: `$${(profile.tuitionPaid ?? 0).toLocaleString()}` },
    { label: 'Scholarship', value: `$${(profile.scholarshipAmount ?? 0).toLocaleString()}` },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Review & results
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Here&apos;s a summary of your answers and estimated refund.
      </p>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Your answers
        </h2>
        <dl className="space-y-2 text-sm">
          {summary.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-8">
        <RefundCalculator profile={profile} annualWages={profile.annualWages} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/chat"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            }
          }}
          className="rounded-full bg-emerald-600 px-6 py-3 text-center font-medium text-white transition hover:bg-emerald-700"
        >
          Chat with TaxBuddy AI
        </Link>
        <Link
          href="/forms"
          className="rounded-full border border-zinc-300 px-6 py-3 text-center font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Generate My Forms
        </Link>
      </div>
    </div>
  );
}
