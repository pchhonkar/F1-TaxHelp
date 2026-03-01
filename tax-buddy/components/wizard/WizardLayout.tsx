'use client';

import { StepIndicator } from './StepIndicator';
import { useWizard } from './WizardContext';

export function WizardLayout({ children }: { children: React.ReactNode }) {
  const { step } = useWizard();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <StepIndicator current={step} />
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
