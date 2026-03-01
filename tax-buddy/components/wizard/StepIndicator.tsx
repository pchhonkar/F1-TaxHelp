'use client';

const TOTAL_STEPS = 7;

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
            n <= current ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}
