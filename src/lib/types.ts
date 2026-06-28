export type Confidence = "confirmed" | "suspected";
export type EntityType = "actor" | "vulnerability" | "campaign" | "sector";
export type RelationshipType = "exploits" | "runs" | "targets" | "overlaps" | "usedIn";
export type Severity = "critical" | "high" | "medium" | "low";
export type ExploitationStatus =
  | "actively-exploited"
  | "poc-available"
  | "unpatched"
  | "patched";
export type ActorStatus = "active" | "dormant" | "disbanded";

export interface ThreatActor {
  type: "actor";
  id: string;
  name: string;
  aliases: string[];
  description: string;
  attribution: string;
  attributionConfidence: Confidence;
  motivation: string;
  status: ActorStatus;
}

export interface Vulnerability {
  type: "vulnerability";
  id: string;
  cve: string;
  commonName: string;
  description: string;
  cvssScore: number;
  severity: Severity;
  affectedProduct: string;
  exploitationStatus: ExploitationStatus;
  datePublished: string;
}

export interface Campaign {
  type: "campaign";
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  attributedTo: string;
  attributionConfidence: Confidence;
}

export interface TargetSector {
  type: "sector";
  id: string;
  name: string;
  description: string;
}

export type Entity = ThreatActor | Vulnerability | Campaign | TargetSector;

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  confidence: Confidence;
  source: string;
  notes?: string;
}

export interface IntelData {
  actors: ThreatActor[];
  vulnerabilities: Vulnerability[];
  campaigns: Campaign[];
  sectors: TargetSector[];
  relationships: Relationship[];
}
