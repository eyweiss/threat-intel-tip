import intelData from "@/data/intel.json";
import type {
  Entity,
  EntityType,
  ThreatActor,
  Vulnerability,
  Campaign,
  TargetSector,
  Relationship,
  RelationshipType,
  Confidence,
  IntelData,
} from "./types";

const data = intelData as IntelData;

// Flatten all entities into a single lookup map
const entityMap = new Map<string, Entity>([
  ...data.actors.map((a) => [a.id, a] as [string, Entity]),
  ...data.vulnerabilities.map((v) => [v.id, v] as [string, Entity]),
  ...data.campaigns.map((c) => [c.id, c] as [string, Entity]),
  ...data.sectors.map((s) => [s.id, s] as [string, Entity]),
]);

export function getEntity(id: string): Entity | null {
  return entityMap.get(id) ?? null;
}

export function getAllEntities(): Entity[] {
  return [
    ...data.actors,
    ...data.vulnerabilities,
    ...data.campaigns,
    ...data.sectors,
  ];
}

// Returns the actor whose name or aliases match the term (case-insensitive).
// Used for alias resolution hints in search.
export function resolveAlias(term: string): ThreatActor | null {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return null;

  return (
    data.actors.find(
      (a) =>
        a.aliases.some((alias) => alias.toLowerCase() === normalized) &&
        a.name.toLowerCase() !== normalized
    ) ?? null
  );
}

export interface SearchFilters {
  entityType?: EntityType;
  confidence?: Confidence;
  source?: string;
  sectorId?: string;
}

export function searchEntities(query: string, filters: SearchFilters = {}): Entity[] {
  const q = query.trim().toLowerCase();

  // Collect all entities
  const all = getAllEntities();

  // Text match: name, aliases, description, CVE, commonName
  const textMatched = q
    ? all.filter((entity) => {
        if (entity.type.toLowerCase().includes(q)) return true;

        if (entity.type === "actor") {
          const a = entity as ThreatActor;
          return (
            a.name.toLowerCase().includes(q) ||
            a.aliases.some((alias) => alias.toLowerCase().includes(q)) ||
            a.description.toLowerCase().includes(q) ||
            a.attribution.toLowerCase().includes(q) ||
            a.motivation.toLowerCase().includes(q)
          );
        }
        if (entity.type === "vulnerability") {
          const v = entity as Vulnerability;
          return (
            v.cve.toLowerCase().includes(q) ||
            v.commonName.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.affectedProduct.toLowerCase().includes(q)
          );
        }
        if (entity.type === "campaign") {
          const c = entity as Campaign;
          return (
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          );
        }
        if (entity.type === "sector") {
          const s = entity as TargetSector;
          return (
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
          );
        }
        return false;
      })
    : all;

  // Entity type filter
  let results = filters.entityType
    ? textMatched.filter((e) => e.type === filters.entityType)
    : textMatched;

  // Confidence filter: keep entities that have at least one relationship matching
  if (filters.confidence) {
    const conf = filters.confidence;
    results = results.filter((e) => {
      const rels = getRelationships(e.id, "both");
      // Campaigns and actors have their own attributionConfidence
      if (e.type === "actor") {
        const a = e as ThreatActor;
        return a.attributionConfidence === conf || rels.some((r) => r.confidence === conf);
      }
      if (e.type === "campaign") {
        const c = e as Campaign;
        return c.attributionConfidence === conf || rels.some((r) => r.confidence === conf);
      }
      return rels.some((r) => r.confidence === conf);
    });
  }

  // Source filter: keep entities with at least one relationship from that source
  if (filters.source) {
    const src = filters.source.toLowerCase();
    results = results.filter((e) => {
      const rels = getRelationships(e.id, "both");
      return rels.some((r) => r.source.toLowerCase().includes(src));
    });
  }

  // Sector filter: keep actors that target the given sector
  if (filters.sectorId) {
    const sid = filters.sectorId;
    results = results.filter((e) => {
      if (e.type === "sector") return e.id === sid;
      const rels = getRelationships(e.id, "both");
      return rels.some(
        (r) =>
          (r.type === "targets" && (r.sourceId === sid || r.targetId === sid)) ||
          r.sourceId === sid ||
          r.targetId === sid
      );
    });
  }

  return results;
}

export function getRelationships(
  entityId: string,
  direction: "out" | "in" | "both" = "both"
): Relationship[] {
  return data.relationships.filter((r) => {
    if (direction === "out") return r.sourceId === entityId;
    if (direction === "in") return r.targetId === entityId;
    return r.sourceId === entityId || r.targetId === entityId;
  });
}

// Returns relationships grouped by type for display on entity profile pages.
// For symmetric relationships (overlaps), the entity may appear on either side.
export function getGroupedRelationships(entityId: string): Record<RelationshipType, Relationship[]> {
  const rels = getRelationships(entityId, "both");

  return rels.reduce(
    (acc, rel) => {
      acc[rel.type] = [...(acc[rel.type] || []), rel];
      return acc;
    },
    {} as Record<RelationshipType, Relationship[]>
  );
}

// Returns a human-readable display name for an entity
export function getDisplayName(entity: Entity): string {
  if (entity.type === "vulnerability") {
    const v = entity as Vulnerability;
    return v.commonName ? `${v.commonName} (${v.cve})` : v.cve;
  }
  return entity.name;
}

// Returns a one-line summary for search results
export function getEntitySummary(entity: Entity): string {
  if (entity.type === "actor") {
    const a = entity as ThreatActor;
    return `${a.attribution} · ${a.motivation}`;
  }
  if (entity.type === "vulnerability") {
    const v = entity as Vulnerability;
    return `CVSS ${v.cvssScore} · ${v.affectedProduct}`;
  }
  if (entity.type === "campaign") {
    const c = entity as Campaign;
    const actor = getEntity(c.attributedTo) as ThreatActor | null;
    const actorName = actor ? actor.name : "Unknown";
    return `Attributed to ${actorName} · ${c.startDate.slice(0, 4)}${c.endDate ? "" : " – ongoing"}`;
  }
  if (entity.type === "sector") {
    return (entity as TargetSector).description;
  }
  return "";
}

// Returns connection counts for an entity (used in search result rows)
export function getConnectionCounts(entityId: string): {
  total: number;
  byType: Partial<Record<RelationshipType, number>>;
} {
  const rels = getRelationships(entityId, "both");
  const byType: Partial<Record<RelationshipType, number>> = {};
  for (const r of rels) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }
  return { total: rels.length, byType };
}

// Unique sources across all relationships (for the source filter dropdown)
export function getAllSources(): string[] {
  const sources = new Set(data.relationships.map((r) => r.source));
  return Array.from(sources).sort();
}

export { data as intelData };
