export function normalizePersona(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (
    [
      "decision-maker",
      "decision makers",
      "executives",
      "leadership",
      "c-suite",
      "cxo",
    ].includes(v)
  )
    return "decision-makers";
  if (
    [
      "technical",
      "developer",
      "engineer",
      "technical users",
      "technicals",
    ].includes(v)
  )
    return "technical-users";
  if (["end user", "end users", "users"].includes(v)) return "end-users";
  if (["partner", "channel"].includes(v)) return "partners";
  if (["investor", "investors"].includes(v)) return "investors";
  if (["general", "audience", "general audience"].includes(v))
    return "general-audience";
  return value; // already canonical or unknown
}

export function normalizeFunnel(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim().replace(/\s+/g, "-");
  // map common synonyms
  if (["awareness", "tofu", "top", "top-of-funnel"].includes(v))
    return "top-of-funnel";
  if (
    ["consideration", "mofu", "middle", "mid", "middle-of-funnel"].includes(v)
  )
    return "middle-of-funnel";
  if (["decision", "bofu", "bottom", "bottom-of-funnel"].includes(v))
    return "bottom-of-funnel";
  if (["retention", "post-purchase", "postpurchase"].includes(v))
    return "post-purchase";
  if (["lifecycle"].includes(v)) return "lifecycle";
  return value; // already canonical or unknown
}

export function normalizeIndustry(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (["finserv", "fintech", "financial services"].includes(v))
    return "finance";
  if (["tech", "software", "it"].includes(v)) return "technology";
  return value; // keep others as-is
}

export function normalizeTopic(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim().replace(/\s+/g, "-");
  if (["how-to", "howto"].includes(v)) return "how-to-guides";
  if (["thought-leadership", "thoughtleadership"].includes(v))
    return "thought-leadership";
  if (["customer-stories", "case-studies", "customer-success"].includes(v))
    return "customer-success";
  if (["product", "features", "product-features"].includes(v))
    return "product-features";
  if (["industry", "trends", "industry-trends"].includes(v))
    return "industry-trends";
  return value;
}

export function normalizeSegment(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (["smb", "small business", "small"].includes(v)) return "smb";
  if (["mid-market", "midmarket", "medium", "mid-size"].includes(v))
    return "mid-market";
  if (["enterprise", "large", "corp", "corporate"].includes(v))
    return "enterprise";
  return value;
}

// Expand filters to include known synonyms/canonical pairs to improve matches at query time
export function expandPersonaCandidates(value?: string): string[] {
  const n = normalizePersona(value);
  const v = (value || "").toLowerCase().trim();
  const set = new Set<string>();
  if (n) set.add(`persona:${n}`);
  if (v && v !== n) set.add(`persona:${v}`);
  return Array.from(set);
}

export function expandFunnelCandidates(value?: string): string[] {
  const n = normalizeFunnel(value);
  const v = (value || "").toLowerCase().trim().replace(/\s+/g, "-");
  const set = new Set<string>();
  if (n) set.add(`funnel:${n}`);
  // include cross-map between consideration<->middle-of-funnel, decision<->bottom-of-funnel, awareness<->top-of-funnel
  const map: Record<string, string> = {
    awareness: "top-of-funnel",
    "top-of-funnel": "awareness",
    consideration: "middle-of-funnel",
    "middle-of-funnel": "consideration",
    decision: "bottom-of-funnel",
    "bottom-of-funnel": "decision",
    retention: "post-purchase",
    "post-purchase": "retention",
  };
  const partner = map[n || ""] || map[v || ""];
  if (partner) set.add(`funnel:${partner}`);
  if (v && v !== n) set.add(`funnel:${v}`);
  return Array.from(set);
}

export function expandIndustryCandidates(value?: string): string[] {
  const n = normalizeIndustry(value);
  const v = (value || "").toLowerCase().trim();
  const set = new Set<string>();
  if (n) set.add(`industry:${n}`);
  if (v && v !== n) set.add(`industry:${v}`);
  return Array.from(set);
}

export function expandTopicCandidates(value?: string): string[] {
  const n = normalizeTopic(value);
  const v = (value || "").toLowerCase().trim().replace(/\s+/g, "-");
  const set = new Set<string>();
  if (n) set.add(`topic:${n}`);
  if (v && v !== n) set.add(`topic:${v}`);
  return Array.from(set);
}
