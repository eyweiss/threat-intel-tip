import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEntity,
  getRelationships,
  getDisplayName,
} from "@/lib/queries";
import type {
  Entity,
  EntityType,
  ThreatActor,
  Vulnerability,
  Campaign,
  TargetSector,
  Relationship,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { EntityBadge } from "@/components/EntityBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { cn } from "@/lib/utils";

const VALID_TYPES = new Set<string>([
  "actor",
  "vulnerability",
  "campaign",
  "sector",
]);

// ─── URL helpers ──────────────────────────────────────────────────────────────

function buildPivotUrl(
  target: Entity,
  currentId: string,
  trail: string | undefined
): string {
  const newTrail = trail ? `${trail},${currentId}` : currentId;
  return `/entity/${target.type}/${target.id}?trail=${encodeURIComponent(newTrail)}`;
}

function buildBreadcrumbItems(
  trail: string | undefined,
  current: Entity
): { label: string; href: string | null }[] {
  const items: { label: string; href: string | null }[] = [];

  if (!trail) {
    return [{ label: getDisplayName(current), href: null }];
  }

  const parts = trail.split(",").filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const precedingTrail = parts.slice(0, i).join(",");

    if (part === "search") {
      items.push({ label: "Search", href: "/search" });
    } else {
      const entity = getEntity(part);
      if (entity) {
        const trailParam = precedingTrail
          ? `?trail=${encodeURIComponent(precedingTrail)}`
          : "";
        items.push({
          label: getDisplayName(entity),
          href: `/entity/${entity.type}/${entity.id}${trailParam}`,
        });
      }
    }
  }

  items.push({ label: getDisplayName(current), href: null });
  return items;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({
  items,
}: {
  items: { label: string; href: string | null }[];
}) {
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 dark:text-slate-600 select-none">›</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors max-w-[180px] truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 dark:text-slate-300 font-medium max-w-[180px] truncate">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── Relationship row ─────────────────────────────────────────────────────────

function RelationshipRow({
  rel,
  linkedEntity,
  currentId,
  trail,
}: {
  rel: Relationship;
  linkedEntity: Entity;
  currentId: string;
  trail: string | undefined;
}) {
  return (
    <Link
      href={buildPivotUrl(linkedEntity, currentId, trail)}
      className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 group transition-colors"
    >
      <div className="pt-0.5 shrink-0">
        <EntityBadge type={linkedEntity.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-600 dark:group-hover:text-slate-400 truncate">
            {getDisplayName(linkedEntity)}
          </span>
          <ConfidenceBadge confidence={rel.confidence} className="shrink-0" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{rel.source}</p>
        {rel.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic leading-snug">
            {rel.notes}
          </p>
        )}
      </div>
      <svg
        className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 shrink-0 mt-0.5 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

// ─── Relationship section ─────────────────────────────────────────────────────

const EMPTY_MSG =
  "No data held — the absence of a record here is not evidence of absence in the world.";

interface SectionDef {
  title: string;
  rels: Relationship[];
  getLinkedId: (r: Relationship) => string;
  emptyMessage?: string;
}

function RelationshipSection({
  section,
  currentId,
  trail,
}: {
  section: SectionDef;
  currentId: string;
  trail: string | undefined;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {section.title}
        </h3>
        {section.rels.length > 0 && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            ({section.rels.length})
          </span>
        )}
      </div>
      <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900">
        {section.rels.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/50">
            {section.emptyMessage ?? EMPTY_MSG}
          </p>
        ) : (
          section.rels.map((rel) => {
            const linkedId = section.getLinkedId(rel);
            const linkedEntity = getEntity(linkedId);
            if (!linkedEntity) return null;
            return (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                linkedEntity={linkedEntity}
                currentId={currentId}
                trail={trail}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Entity headers ───────────────────────────────────────────────────────────

function ActorHeader({ actor }: { actor: ThreatActor }) {
  const statusStyle: Record<string, string> = {
    active:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    dormant:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    disbanded:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <EntityBadge type="actor" />
        <span
          className={cn(
            "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium capitalize",
            statusStyle[actor.status] ?? statusStyle.dormant
          )}
        >
          {actor.status}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {actor.name}
      </h1>

      {actor.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {actor.aliases.map((alias) => (
            <span
              key={alias}
              className="inline-flex items-center rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300 font-medium"
            >
              {alias}
            </span>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-slate-400 dark:text-slate-500 shrink-0">Attribution</dt>
          <dd className="text-slate-700 dark:text-slate-300 font-medium truncate">
            {actor.attribution}
          </dd>
          <ConfidenceBadge confidence={actor.attributionConfidence} />
        </div>
        <div className="flex items-start gap-2">
          <dt className="text-slate-400 dark:text-slate-500 shrink-0">Motivation</dt>
          <dd className="text-slate-700 dark:text-slate-300">{actor.motivation}</dd>
        </div>
      </dl>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {actor.description}
      </p>
    </>
  );
}

function VulnerabilityHeader({ vuln }: { vuln: Vulnerability }) {
  const severityStyle: Record<string, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-400 text-slate-900",
    low: "bg-emerald-500 text-white",
  };

  const statusLabel: Record<string, string> = {
    "actively-exploited": "Actively Exploited",
    "poc-available": "PoC Available",
    unpatched: "Unpatched",
    patched: "Patched",
  };

  const statusStyle: Record<string, string> = {
    "actively-exploited":
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    "poc-available":
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    unpatched:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    patched:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  };

  const published = new Date(vuln.datePublished).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <EntityBadge type="vulnerability" />
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {vuln.cve}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        {vuln.commonName}
      </h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-sm font-bold",
            severityStyle[vuln.severity]
          )}
        >
          CVSS {vuln.cvssScore}
          <span className="font-medium opacity-80 capitalize">
            · {vuln.severity}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
            statusStyle[vuln.exploitationStatus]
          )}
        >
          {statusLabel[vuln.exploitationStatus]}
        </span>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 mb-5 text-sm">
        <div className="flex gap-2">
          <dt className="text-slate-400 dark:text-slate-500">Product</dt>
          <dd className="text-slate-700 dark:text-slate-300">{vuln.affectedProduct}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-400 dark:text-slate-500">Published</dt>
          <dd className="text-slate-700 dark:text-slate-300">{published}</dd>
        </div>
      </dl>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {vuln.description}
      </p>
    </>
  );
}

function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const actor = getEntity(campaign.attributedTo) as ThreatActor | null;
  const start = new Date(campaign.startDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  const end = campaign.endDate
    ? new Date(campaign.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <EntityBadge type="campaign" />
        {!campaign.endDate && (
          <span className="inline-flex items-center rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-400 font-medium">
            Ongoing
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        {campaign.name}
      </h1>

      <dl className="flex flex-wrap gap-x-6 gap-y-2 mb-5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-slate-400 dark:text-slate-500">Timeline</dt>
          <dd className="text-slate-700 dark:text-slate-300 font-medium">
            {start} → {end ?? "present"}
          </dd>
        </div>
        {actor && (
          <div className="flex items-center gap-2">
            <dt className="text-slate-400 dark:text-slate-500">Attributed to</dt>
            <dd className="flex items-center gap-1.5">
              <Link
                href={`/entity/actor/${actor.id}`}
                className="text-purple-700 dark:text-purple-400 font-medium hover:underline"
              >
                {actor.name}
              </Link>
              <ConfidenceBadge confidence={campaign.attributionConfidence} />
            </dd>
          </div>
        )}
      </dl>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {campaign.description}
      </p>
    </>
  );
}

function SectorHeader({ sector }: { sector: TargetSector }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <EntityBadge type="sector" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        {sector.name}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {sector.description}
      </p>
    </>
  );
}

// ─── Section definitions per entity type ─────────────────────────────────────

function getSections(entity: Entity, rels: Relationship[]): SectionDef[] {
  const id = entity.id;

  if (entity.type === "actor") {
    return [
      {
        title: "Exploits",
        rels: rels.filter((r) => r.type === "exploits" && r.sourceId === id),
        getLinkedId: (r) => r.targetId,
      },
      {
        title: "Campaigns",
        rels: rels.filter((r) => r.type === "runs" && r.sourceId === id),
        getLinkedId: (r) => r.targetId,
      },
      {
        title: "Targeted sectors",
        rels: rels.filter((r) => r.type === "targets" && r.sourceId === id),
        getLinkedId: (r) => r.targetId,
      },
      {
        title: "Overlaps with",
        rels: rels.filter(
          (r) =>
            r.type === "overlaps" &&
            (r.sourceId === id || r.targetId === id)
        ),
        getLinkedId: (r) => (r.sourceId === id ? r.targetId : r.sourceId),
      },
    ];
  }

  if (entity.type === "vulnerability") {
    return [
      {
        title: "Exploited by",
        rels: rels.filter((r) => r.type === "exploits" && r.targetId === id),
        getLinkedId: (r) => r.sourceId,
      },
      {
        title: "Used in campaigns",
        rels: rels.filter((r) => r.type === "usedIn" && r.sourceId === id),
        getLinkedId: (r) => r.targetId,
      },
    ];
  }

  if (entity.type === "campaign") {
    return [
      {
        title: "Attributed to",
        rels: rels.filter((r) => r.type === "runs" && r.targetId === id),
        getLinkedId: (r) => r.sourceId,
      },
      {
        title: "Vulnerabilities used",
        rels: rels.filter((r) => r.type === "usedIn" && r.targetId === id),
        getLinkedId: (r) => r.sourceId,
      },
    ];
  }

  if (entity.type === "sector") {
    return [
      {
        title: "Targeted by",
        rels: rels.filter((r) => r.type === "targets" && r.targetId === id),
        getLinkedId: (r) => r.sourceId,
      },
    ];
  }

  return [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ trail?: string }>;
}) {
  const { type, id } = await params;
  const { trail } = await searchParams;

  if (!VALID_TYPES.has(type)) notFound();

  const entity = getEntity(id);
  if (!entity || entity.type !== (type as EntityType)) notFound();

  const rels = getRelationships(id, "both");
  const sections = getSections(entity, rels);
  const crumbs = buildBreadcrumbItems(trail, entity);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={crumbs} />

        {/* Entity header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm p-6 mb-6 relative">
          {rels.length > 0 && (
            <div className="absolute top-4 right-5 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              {rels.length} connection{rels.length !== 1 ? "s" : ""}
            </div>
          )}
          {entity.type === "actor" && (
            <ActorHeader actor={entity as ThreatActor} />
          )}
          {entity.type === "vulnerability" && (
            <VulnerabilityHeader vuln={entity as Vulnerability} />
          )}
          {entity.type === "campaign" && (
            <CampaignHeader campaign={entity as Campaign} />
          )}
          {entity.type === "sector" && (
            <SectorHeader sector={entity as TargetSector} />
          )}
        </div>

        {/* Connected intelligence */}
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Connected intelligence
            </span>
            <span className="ml-2 text-slate-400 dark:text-slate-500 text-xs">
              — click any row to pivot to that entity
            </span>
          </p>
          {sections.map((section) => (
            <RelationshipSection
              key={section.title}
              section={section}
              currentId={entity.id}
              trail={trail}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
