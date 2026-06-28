import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { intelData } from "@/lib/queries";

const features = [
  {
    title: "Search & resolve",
    body: "Full-text search across actors, CVEs, campaigns, and sectors. Type an alias like \"Nobelium\" and the platform resolves it to the canonical actor.",
  },
  {
    title: "Profile & connect",
    body: "Every entity has a profile showing all known relationships grouped by type — exploits, runs, targets, overlaps — with confidence and source citations.",
  },
  {
    title: "Pivot navigation",
    body: "Click any connected entity to pivot to its profile. The breadcrumb trail records your path so you can trace back through multi-hop explorations.",
  },
];

export default function HomePage() {
  const stats = [
    { label: "Threat actors", value: intelData.actors.length },
    { label: "Vulnerabilities", value: intelData.vulnerabilities.length },
    { label: "Campaigns", value: intelData.campaigns.length },
    { label: "Sectors", value: intelData.sectors.length },
    { label: "Relationships", value: intelData.relationships.length },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 font-medium mb-6">
              PM Assignment Prototype — eSentire
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Threat Intelligence
              <br />
              <span className="text-slate-400">Platform</span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-lg">
              A working prototype demonstrating threat intelligence search and
              knowledge graph exploration. Search across actors, CVEs, campaigns,
              and sectors — then pivot between connected entities to trace
              relationships across the threat landscape.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Search intelligence
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <a
                href="https://github.com/eyweiss/threat-intel-tip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {value}
                </span>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
            <div className="flex items-baseline gap-1.5 ml-auto">
              <span className="text-xs text-slate-400 italic">
                Illustrative data only — not for operational use
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {features.map(({ title, body }, i) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-md p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                  0{i + 1}
                </span>
                <h3 className="text-sm font-semibold text-slate-800 capitalize">
                  {title}
                </h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Try it prompt */}
        <div className="bg-slate-900 rounded-md p-6 text-center">
          <p className="text-slate-300 text-sm mb-1">
            Try searching for{" "}
            <Link
              href="/search?q=Nobelium"
              className="text-white font-semibold underline underline-offset-2"
            >
              Nobelium
            </Link>
            {" "}→{" "}
            <Link
              href="/entity/vulnerability/vuln-log4shell?trail=search"
              className="text-white font-semibold underline underline-offset-2"
            >
              Log4Shell
            </Link>
            {" "}→{" "}
            <Link
              href="/entity/actor/ta-apt28?trail=search%2Cta-apt29%2Cvuln-log4shell"
              className="text-white font-semibold underline underline-offset-2"
            >
              APT28
            </Link>
          </p>
          <p className="text-slate-500 text-xs">
            A sample pivot path from the assignment brief
          </p>
        </div>
      </div>
    </AppShell>
  );
}
