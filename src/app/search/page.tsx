"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { EntityBadge } from "@/components/EntityBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import {
  searchEntities,
  resolveAlias,
  getConnectionCounts,
  getDisplayName,
  getEntitySummary,
  intelData,
} from "@/lib/queries";
import type {
  Entity,
  EntityType,
  Confidence,
  ThreatActor,
  Vulnerability,
  Campaign,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function entityPath(entity: Entity): string {
  return `/entity/${entity.type}/${entity.id}?trail=search`;
}

function getEntityAliases(entity: Entity): string[] {
  if (entity.type === "actor") return (entity as ThreatActor).aliases;
  if (entity.type === "vulnerability") return [(entity as Vulnerability).cve];
  return [];
}

function getEntityConfidence(entity: Entity): Confidence | null {
  if (entity.type === "actor") return (entity as ThreatActor).attributionConfidence;
  if (entity.type === "campaign") return (entity as Campaign).attributionConfidence;
  if (entity.type === "vulnerability") return "confirmed";
  return null;
}

// ─── filter chip component ───────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
  colorClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer",
        active
          ? colorClass ?? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800"
      )}
    >
      {children}
    </button>
  );
}

// ─── result row ──────────────────────────────────────────────────────────────

function ResultRow({ entity }: { entity: Entity }) {
  const aliases = getEntityAliases(entity);
  const confidence = getEntityConfidence(entity);
  const summary = getEntitySummary(entity);
  const { total } = getConnectionCounts(entity.id);
  const displayName = getDisplayName(entity);

  return (
    <Link
      href={entityPath(entity)}
      className="block border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <EntityBadge type={entity.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                {displayName}
              </span>
              {aliases.length > 0 && (
                <span className="ml-2 flex-wrap gap-1 inline-flex">
                  {aliases.map((alias) => (
                    <span
                      key={alias}
                      className="inline text-[11px] text-slate-400 font-normal"
                    >
                      {alias}
                    </span>
                  )).reduce((acc: React.ReactNode[], el, i, arr) => {
                    acc.push(el);
                    if (i < arr.length - 1) acc.push(<span key={`sep-${i}`} className="text-slate-300 text-[11px]"> · </span>);
                    return acc;
                  }, [])}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {confidence && <ConfidenceBadge confidence={confidence} />}
              {total > 0 && (
                <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                  {total} link{total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug truncate">{summary}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── typeahead suggestion ────────────────────────────────────────────────────

function Suggestion({
  entity,
  highlighted,
  onSelect,
}: {
  entity: Entity;
  highlighted: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // don't blur the input
        onSelect();
      }}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
        highlighted ? "bg-slate-100" : "hover:bg-slate-50"
      )}
    >
      <EntityBadge type={entity.type} />
      <span className="text-sm text-slate-800 truncate">{getDisplayName(entity)}</span>
      {entity.type === "actor" && (entity as ThreatActor).aliases.length > 0 && (
        <span className="text-xs text-slate-400 truncate hidden sm:inline">
          {(entity as ThreatActor).aliases.slice(0, 2).join(" · ")}
        </span>
      )}
    </button>
  );
}

// ─── constants ───────────────────────────────────────────────────────────────

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "actor", label: "Actors" },
  { value: "vulnerability", label: "Vulnerabilities" },
  { value: "campaign", label: "Campaigns" },
  { value: "sector", label: "Sectors" },
];

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "suspected", label: "Suspected" },
];

// ─── main page ───────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<Confidence | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Alias resolution hint
  const resolvedAlias = useMemo(
    () => (query.trim().length >= 2 ? resolveAlias(query) : null),
    [query]
  );

  // Typeahead suggestions (up to 8, entity-name/alias match)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchEntities(query, {}).slice(0, 8);
  }, [query]);

  // Main results (apply all filters)
  const results = useMemo(() => {
    return searchEntities(query, {
      entityType: entityTypeFilter ?? undefined,
      confidence: confidenceFilter ?? undefined,
      sectorId: sectorFilter ?? undefined,
    });
  }, [query, entityTypeFilter, confidenceFilter, sectorFilter]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigateToEntity = useCallback(
    (entity: Entity) => {
      setDropdownOpen(false);
      router.push(entityPath(entity));
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      navigateToEntity(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setHighlightedIndex(-1);
    setDropdownOpen(value.trim().length > 0);
  }

  const sectors = intelData.sectors;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800 mb-1">
            Intelligence Search
          </h1>
          <p className="text-sm text-slate-500">
            Search across threat actors, vulnerabilities, campaigns, and sectors.
          </p>
        </div>

        {/* Search input + typeahead */}
        <div className="relative mb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (query.trim().length > 0) setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, alias, CVE, sector…"
              className="pl-9 h-10 text-sm bg-white border-slate-300 focus:border-slate-400 shadow-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setDropdownOpen(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Typeahead dropdown */}
          {dropdownOpen && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden"
            >
              {suggestions.map((entity, i) => (
                <Suggestion
                  key={entity.id}
                  entity={entity}
                  highlighted={i === highlightedIndex}
                  onSelect={() => navigateToEntity(entity)}
                />
              ))}
              <div className="border-t border-slate-100 px-3 py-1.5 bg-slate-50">
                <span className="text-[11px] text-slate-400">
                  ↵ Enter to select · ↑↓ to navigate · Esc to close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alias resolution hint */}
        {resolvedAlias && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Alias resolved:{" "}
              <span className="font-medium text-slate-600">
                &ldquo;{query}&rdquo;
              </span>{" "}
              →{" "}
              <Link
                href={entityPath(resolvedAlias)}
                className="font-semibold text-purple-700 hover:underline"
              >
                {resolvedAlias.name}
              </Link>
            </span>
          </div>
        )}

        {/* Filter row */}
        <div className="mb-5 space-y-2">
          {/* Entity type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide w-16 shrink-0">
              Type
            </span>
            <FilterChip active={entityTypeFilter === null} onClick={() => setEntityTypeFilter(null)}>
              All
            </FilterChip>
            {ENTITY_TYPES.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={entityTypeFilter === value}
                onClick={() =>
                  setEntityTypeFilter(entityTypeFilter === value ? null : value)
                }
                colorClass={
                  value === "actor"
                    ? "bg-purple-800 text-white border-purple-800"
                    : value === "vulnerability"
                    ? "bg-rose-700 text-white border-rose-700"
                    : value === "campaign"
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-slate-600 text-white border-slate-600"
                }
              >
                {label}
              </FilterChip>
            ))}
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide w-16 shrink-0">
              Confidence
            </span>
            <FilterChip active={confidenceFilter === null} onClick={() => setConfidenceFilter(null)}>
              All
            </FilterChip>
            {CONFIDENCE_OPTIONS.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={confidenceFilter === value}
                onClick={() =>
                  setConfidenceFilter(confidenceFilter === value ? null : value)
                }
                colorClass={
                  value === "confirmed"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-amber-600 text-white border-amber-600"
                }
              >
                {label}
              </FilterChip>
            ))}
          </div>

          {/* Sector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide w-16 shrink-0">
              Sector
            </span>
            <FilterChip active={sectorFilter === null} onClick={() => setSectorFilter(null)}>
              All
            </FilterChip>
            {sectors.map((s) => (
              <FilterChip
                key={s.id}
                active={sectorFilter === s.id}
                onClick={() =>
                  setSectorFilter(sectorFilter === s.id ? null : s.id)
                }
              >
                {s.name}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {results.length === 0
                ? "No results"
                : `${results.length} result${results.length !== 1 ? "s" : ""}`}
              {query && (
                <span className="text-slate-400">
                  {" "}for &ldquo;{query}&rdquo;
                </span>
              )}
            </span>
            {(entityTypeFilter || confidenceFilter || sectorFilter) && (
              <button
                onClick={() => {
                  setEntityTypeFilter(null);
                  setConfidenceFilter(null);
                  setSectorFilter(null);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-500">
                No intelligence matching your search.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try a different term or clear the filters.
              </p>
            </div>
          ) : (
            <div>
              {results.map((entity) => (
                <ResultRow key={entity.id} entity={entity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
