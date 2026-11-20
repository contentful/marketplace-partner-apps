/**
 * evidenceMap.ts
 *
 * Structural per-field evidence pre-filtering.
 *
 * Instead of dumping all zones into the prompt and asking the LLM to follow
 * advisory routing rules, this module builds a typed EvidenceMap that
 * physically contains only the text allowed for each taxonomy field.
 *
 * This eliminates cross-zone contamination at the data layer rather than
 * relying on the LLM to self-restrict. Key improvements over advisory routing:
 *
 *  - jobFunction: only receives hero/summary explicit audience language.
 *    Speaker zone titles are structurally absent — the model cannot use them
 *    even if it ignores the routing instruction.
 *  - industry: only receives hero/summary vertical framing + body section
 *    headings. Footer logo lists are structurally absent.
 *  - funnelStage: only receives CTA zone text and the page CTA list.
 *    Cannot derive stage from topic or speaker seniority.
 *  - topic / useCases: suppresses quote, speaker, footer zones.
 *  - competitivePositioning: only body comparison language, never quotes.
 *  - jobLevel: hero + summary + speaker (speaker titles ARE valid seniority
 *    evidence for level, unlike function).
 *
 * Each field entry carries:
 *  - text: the concatenated allowed-zone text (char-budgeted)
 *  - zones: the source zone names for provenance
 *  - truncated: whether the budget was hit
 */

import type { ContentZone, ZoneType } from "./recursiveCrawler.js";

// ---------------------------------------------------------------------------
// Field evidence policy — defines which zone types each field may use
// ---------------------------------------------------------------------------

export type EvidenceField =
  | "topic"
  | "useCases"
  | "industry"
  | "jobFunction"
  | "jobLevel"
  | "funnelStage"
  | "competitivePositioning"
  | "product"
  | "audience";

/** Zones allowed as primary evidence for each field */
const FIELD_ALLOWED_ZONES: Record<EvidenceField, Set<ZoneType>> = {
  topic: new Set(["hero", "summary", "subtitle", "section_heading", "body"]),
  useCases: new Set(["hero", "summary", "subtitle", "section_heading", "body"]),
  industry: new Set(["hero", "summary", "subtitle", "body"]),
  jobFunction: new Set(["hero", "summary", "subtitle"]), // NO speaker, quote, footer
  jobLevel: new Set(["hero", "summary", "subtitle", "speaker"]), // speaker OK for seniority
  funnelStage: new Set(["cta"]), // CTA-only — independent
  competitivePositioning: new Set(["hero", "summary", "body"]), // NO quote mentions
  product: new Set(["hero", "summary", "subtitle", "section_heading", "body"]),
  audience: new Set(["hero", "summary", "subtitle"]),
};

/** Char budget per field (keeps prompt tight per field, not per total) */
const FIELD_CHAR_BUDGETS: Record<EvidenceField, number> = {
  topic: 800,
  useCases: 600,
  industry: 500,
  jobFunction: 400,
  jobLevel: 400,
  funnelStage: 300,
  competitivePositioning: 600,
  product: 500,
  audience: 300,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldEvidence {
  /** Pre-filtered, budget-capped text for this field */
  text: string;
  /** Zone names that contributed text (for provenance) */
  sourceZones: string[];
  /** True if the char budget was reached and text was cut */
  truncated: boolean;
}

export type EvidenceMap = Record<EvidenceField, FieldEvidence>;

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build a per-field evidence map from ContentZone[].
 * Each field only receives text from zones in its allow-list.
 *
 * Default sort: position ascending (top-first), weight descending as tiebreak.
 *
 * funnelStage exception: sorts CTA zones by weight descending so the strongest
 * CTA wins over page position. A "Contact Sales" CTA at the bottom of the page
 * is a stronger BOFU signal than a generic "Learn more" link at the top — the
 * position-first sort would truncate the budget on the weaker CTA and hide the
 * stronger one.
 */
export function buildEvidenceMap(zones: ContentZone[]): EvidenceMap {
  const ordered = [...zones].sort(
    (a, b) => a.position - b.position || b.weight - a.weight,
  );
  // funnelStage: strongest-CTA-first so high-intent signals dominate the budget.
  // Computed lazily — only materialised when funnelStage is processed.
  let orderedByWeight: ContentZone[] | null = null;

  const fields = Object.keys(FIELD_ALLOWED_ZONES) as EvidenceField[];
  const map = {} as EvidenceMap;

  for (const field of fields) {
    const allowed = FIELD_ALLOWED_ZONES[field];
    const budget = FIELD_CHAR_BUDGETS[field];
    if (field === "funnelStage" && orderedByWeight === null) {
      orderedByWeight = [...zones].sort(
        (a, b) => b.weight - a.weight || a.position - b.position,
      );
    }
    const zoneList = field === "funnelStage" ? orderedByWeight! : ordered;
    const parts: string[] = [];
    const sourceZones: string[] = [];
    let used = 0;
    let truncated = false;

    for (const zone of zoneList) {
      if (!allowed.has(zone.zoneType)) continue;
      if (!zone.text.trim()) continue;
      if (used >= budget) {
        truncated = true;
        break;
      }

      const available = budget - used;
      const snippet = zone.text.slice(0, available);
      parts.push(snippet);
      sourceZones.push(zone.name);
      used += snippet.length;
      if (snippet.length < zone.text.length) {
        truncated = true;
        break;
      }
    }

    map[field] = {
      text: parts.join("\n\n"),
      sourceZones,
      truncated,
    };
  }

  return map;
}

// ---------------------------------------------------------------------------
// Prompt serializer
// ---------------------------------------------------------------------------

/**
 * Serialize an EvidenceMap into a compact prompt block.
 *
 * The block replaces the flat zone dump + advisory routing rules.
 * Each field section is self-contained: the LLM cannot see cross-field
 * evidence because it was never included.
 *
 * @param map - pre-built evidence map
 * @param fields - which fields to include (default: all)
 * @param includeSourceZones - whether to include [from: zone1, zone2] provenance
 */
export function serializeEvidenceMap(
  map: EvidenceMap,
  fields: EvidenceField[] = Object.keys(FIELD_ALLOWED_ZONES) as EvidenceField[],
  includeSourceZones = true,
): string {
  const sections: string[] = [];

  for (const field of fields) {
    const ev = map[field];
    if (!ev || !ev.text.trim()) {
      sections.push(`[EVIDENCE:${field}]\n(no evidence in allowed zones)`);
      continue;
    }
    const provenance =
      includeSourceZones && ev.sourceZones.length > 0
        ? ` [from: ${ev.sourceZones.join(", ")}${ev.truncated ? ", …" : ""}]`
        : "";
    sections.push(`[EVIDENCE:${field}]${provenance}\n${ev.text}`);
  }

  return sections.join("\n\n");
}

/**
 * Build a compact field-evidence block for the fact prompt stage.
 * Includes: topic, useCases, industry, product (objective fields from zones).
 */
export function buildFactEvidenceBlock(map: EvidenceMap): string {
  return serializeEvidenceMap(map, [
    "topic",
    "useCases",
    "industry",
    "product",
  ]);
}

/**
 * Build a compact field-evidence block for the subjective prompt stage.
 * Includes: jobFunction, jobLevel, funnelStage, audience, competitivePositioning.
 */
export function buildSubjectiveEvidenceBlock(map: EvidenceMap): string {
  return serializeEvidenceMap(map, [
    "jobFunction",
    "jobLevel",
    "funnelStage",
    "audience",
    "competitivePositioning",
  ]);
}
