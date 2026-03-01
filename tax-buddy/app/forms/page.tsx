'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { calculateEstimatedRefund } from '@/lib/tax-rules';
import type { UserProfile } from '@/types';

const PROFILE_KEY = 'taxbuddy-wizard-profile';

const FORMS_INFO = [
  {
    id: '8843',
    name: 'Form 8843',
    description:
      "Statement for Exempt Individuals. Required for ALL F1/J1 visa holders who were in the US any part of the year, even with zero income.",
    when: 'Attach to 1040-NR or file separately by June 15',
    deadline: 'June 15',
  },
  {
    id: '1040nr-summary',
    name: 'Form 1040-NR Summary',
    description:
      'Worksheet summarizing your income, treaty benefits, and what to enter on each line of Form 1040-NR.',
    when: 'Use when completing the actual Form 1040-NR',
    deadline: 'April 15 (or June 15 if employer did not withhold)',
  },
];

const DEADLINES = [
  { form: 'Form 1040-NR', date: 'April 15', note: 'Or June 15 if employer did not withhold tax' },
  { form: 'Form 8843', date: 'June 15', note: 'If filing separately from 1040-NR' },
  { form: 'Form 843 (FICA refund)', date: '3 years from filing', note: 'Within statute of limitations' },
];

export default function FormsPage() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        setProfile(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDownload = async (formType: string) => {
    if (!profile) {
      setError('Complete the wizard first to generate forms.');
      return;
    }
    setLoading(formType);
    setError(null);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, profile }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = formType === '8843' ? 'Form-8843-Worksheet.pdf' : 'Form-1040-NR-Summary.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(null);
    }
  };

  const calc = profile ? calculateEstimatedRefund(profile, { annualWages: (profile as { annualWages?: number }).annualWages }) : null;
  const formsNeeded = calc?.formsNeeded ?? ['Form 8843'];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/wizard"
          className="mb-6 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to wizard
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Your tax forms
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Download worksheets to help you complete your tax filing.
        </p>

        {!profile && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-amber-800 dark:text-amber-200">
              Complete the wizard first to generate personalized forms.
            </p>
            <Link
              href="/wizard"
              className="mt-3 inline-block font-medium text-amber-900 dark:text-amber-100"
            >
              Start wizard →
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mb-10 space-y-6">
          {FORMS_INFO.map((form) => (
            <div
              key={form.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {form.name}
              </h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {form.description}
              </p>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
                When: {form.when}
              </p>
              <button
                type="button"
                onClick={() => handleDownload(form.id)}
                disabled={loading !== null}
                className="rounded-full bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading === form.id ? 'Generating…' : 'Download'}
              </button>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Important deadlines
          </h2>
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            {DEADLINES.map((d) => (
              <div key={d.form} className="flex justify-between gap-4 border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{d.form}</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">{d.note}</p>
                </div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{d.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
