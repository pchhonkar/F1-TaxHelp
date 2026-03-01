import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          TaxBuddy
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          AI-powered tax assistant for international students in the USA. File
          your taxes, claim your maximum refund.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/wizard"
            className="rounded-full bg-emerald-600 px-8 py-3 font-medium text-white transition hover:bg-emerald-700"
          >
            Start Tax Wizard
          </Link>
          <Link
            href="/chat"
            className="rounded-full border border-zinc-300 px-8 py-3 font-medium transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Chat with TaxBuddy AI
          </Link>
        </div>
      </main>
    </div>
  );
}
