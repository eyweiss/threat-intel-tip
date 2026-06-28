import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/search"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            <span className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest">
              TIP
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">
              Threat Intelligence Platform
            </span>
          </Link>
          <nav className="flex items-center">
            <Link
              href="/search"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              Search
              <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                /
              </kbd>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3">
        <div className="max-w-5xl mx-auto px-4 text-xs text-slate-400 dark:text-slate-600">
          Illustrative data only — not for operational use
        </div>
      </footer>
    </div>
  );
}
