import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-600 transition-colors"
          >
            <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest">
              TIP
            </span>
            <span className="text-slate-400 font-normal hidden sm:inline">
              Threat Intelligence Platform
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Search
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 py-3">
        <div className="max-w-5xl mx-auto px-4 text-xs text-slate-400">
          PM Assignment prototype — eSentire · Data is illustrative only
        </div>
      </footer>
    </div>
  );
}
