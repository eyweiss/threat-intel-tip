# Threat Intelligence Platform — eSentire PM Assignment

A working prototype demonstrating threat intelligence search and knowledge graph exploration, built as a PM assignment for eSentire.

**Live demo:** [threat-intel-tip.vercel.app](https://threat-intel-tip.vercel.app) &nbsp;·&nbsp; **Repo:** [eyweiss/threat-intel-tip](https://github.com/eyweiss/threat-intel-tip)

---

## What it does

The platform lets a user search across four entity types — threat actors, CVEs, campaigns, and sectors — and pivot between related entities to explore how they connect.

**Key flows:**
1. **Search with alias resolution** — type "Nobelium" and it resolves to APT29
2. **Filter results** by entity type, confidence level (confirmed / suspected), and sector
3. **Entity profiles** show all known relationships grouped by verb (Exploits, Runs, Targets, Overlaps with), each with a confidence badge and source citation
4. **Pivot navigation** — click any connected entity to jump to its profile; a breadcrumb records the path
5. **Empty-state honesty** — sections with no data say "no data held" rather than hiding, distinguishing absence-of-record from absence-of-fact

**Sample path from the brief:**  
Search "Nobelium" → APT29 profile → Log4Shell (exploited by 5 actors) → APT28 (suspected overlap back to APT29) — breadcrumb shows the full trail

---

## Domain model

| Entity | Key fields |
|--------|-----------|
| **ThreatActor** | name, aliases[], attribution, motivation, status |
| **Vulnerability** | CVE id, commonName, CVSS score, severity, exploitationStatus |
| **Campaign** | name, timeline, attributedTo (actor), attributionConfidence |
| **TargetSector** | name, description |

Relationships (each with `confidence` and `source`):  
`exploits` · `runs` · `targets` · `overlaps` · `usedIn`

**Seed data:** 5 actors · 4 CVEs · 5 campaigns · 7 sectors · 30 relationships

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Data | Static JSON file (`src/data/intel.json`) — no backend |
| Fonts | Inter + JetBrains Mono via `next/font/google` |
| Deploy | Vercel |

No database, no auth, no API routes.

---

## Running locally

```bash
git clone https://github.com/eyweiss/threat-intel-tip.git
cd threat-intel-tip
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── search/page.tsx            # Search — typeahead, filters, results
│   └── entity/[type]/[id]/
│       └── page.tsx               # Entity profile — header + relationship sections
├── components/
│   ├── AppShell.tsx               # Sticky nav header + footer
│   ├── EntityBadge.tsx            # Purple/rose/teal/gray type badge
│   └── ConfidenceBadge.tsx        # Emerald (confirmed) / amber (suspected) pill
├── data/
│   └── intel.json                 # All entities and relationships
└── lib/
    ├── types.ts                   # TypeScript interfaces (Entity, Relationship, …)
    └── queries.ts                 # getEntity, searchEntities, resolveAlias, getRelationships
```

---

## Scope boundaries

Deliberately out of scope: authentication, real database, multi-hop graph visualization, authoring/editing, dark mode.

All data is illustrative and does not represent eSentire's actual intelligence holdings.
