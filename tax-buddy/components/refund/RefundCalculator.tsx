'use client';

import { useState, useEffect } from 'react';
import { calculateEstimatedRefund } from '@/lib/tax-rules';
import type { UserProfile } from '@/types';

function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (v: number) => void
) {
  const start = performance.now();
  const run = (now: number) => {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - t) ** 2;
    const v = Math.round(from + (to - from) * eased);
    onUpdate(v);
    if (t < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

interface RefundCalculatorProps {
  profile: Partial<UserProfile>;
  annualWages?: number;
}

export function RefundCalculator({ profile, annualWages }: RefundCalculatorProps) {
  const calc = calculateEstimatedRefund(profile, { annualWages });
  const [federal, setFederal] = useState(0);
  const [fica, setFica] = useState(0);
  const [treaty, setTreaty] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fed = calc.federalTaxRefund ?? 0;
    const fic = calc.ficaRefundAmount ?? 0;
    const tre = calc.treatyBenefitAmount ?? 0;
    const tot = calc.estimatedRefund ?? 0;
    const dur = 600;
    animateValue(0, fed, dur, setFederal);
    animateValue(0, fic, dur, setFica);
    animateValue(0, tre, dur, setTreaty);
    animateValue(0, tot, dur, setTotal);
  }, [calc]);

  const format = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Your estimated refund
      </h2>

      <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
        {federal > 0 && (
          <div className="flex justify-between" title="Federal income tax withheld on your paycheck">
            <span>Federal Tax Refund</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{format(federal)}</span>
          </div>
        )}
        {fica > 0 && (
          <div className="flex justify-between gap-2" title="Social Security + Medicare wrongly withheld (Form 843)">
            <span>FICA Refund</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {format(fica)}
            </span>
          </div>
        )}
        {treaty > 0 && (
          <div className="flex justify-between" title="Tax savings from your country's treaty">
            <span>Treaty Benefit</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{format(treaty)}</span>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="flex justify-between text-lg font-semibold">
          <span>TOTAL POTENTIAL</span>
          <span className="text-emerald-600 dark:text-emerald-400">{format(total)}</span>
        </div>
      </div>

      {calc.formsNeeded.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Forms you need to file:
          </p>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {calc.formsNeeded.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        This is an estimate. Actual refund depends on your specific tax documents.
      </p>
    </div>
  );
}
