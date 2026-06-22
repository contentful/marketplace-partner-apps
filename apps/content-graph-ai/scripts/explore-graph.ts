#!/usr/bin/env tsx
/**
 * explore-graph.ts
 *
 * Content graph explorer — understand how your pages connect to each other.
 * Works without a database by reading .cache/classification-history.json
 * and computing edges in-memory using the same overlap rules as pgGraph.ts.
 *
 * Commands:
 *   --related <entryId>         Find content similar/related to a page
 *   --related <entryId> --rels SIMILAR_TO,SUPPORTS_PILLAR
 *   --topic <topic>             List all pages tagged with a topic
 *   --gaps                      Topics with TOFU content but no pillar backing
 *   --serp                      Pages competing for the same SERP (cannibalization risk)
 *   --overview                  Full taxonomy distribution + edge summary
 *   --mermaid [entryId]         Export Mermaid graph (all, or focused on one entry)
 *
 * Examples:
 *   npx tsx scripts/explore-graph.ts --overview
 *   npx tsx scripts/explore-graph.ts --related hclvhMBxnJbxq8OQQv7HN
 *   npx tsx scripts/explore-graph.ts --topic "Headless CMS"
 *   npx tsx scripts/explore-graph.ts --gaps
 *   npx tsx scripts/explore-graph.ts --serp
 *   npx tsx scripts/explore-graph.ts --mermaid > graph.mmd
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Load classification history
// ---------------------------------------------------------------------------
const HISTORY_FILE = path.resolve(".cache/classification-history.json");

interface HistoryEntry {
  entryId: string;
  title: string;
  url: string;
  contentType?: string;
  classifiedAt: string;
  overallConfidence: number;
  needsReview: boolean;
  fields: Record<string, { value: string | string[]; confidence: number }>;
}

function loadHistory(): Record<string, HistoryEntry> {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch {
    /* missing or corrupt */
  }
  return {};
}

// ---------------------------------------------------------------------------
// Derived asset shape (flattened for graph logic)
// ---------------------------------------------------------------------------
interface Asset {
  entryId: string;
  title: string;
  url: string;
  contentType: string;
  topics: string[];
  funnelStage: string;
  industry: string[];
  audience: string[];
  jobFunction: string[];
  isPillar: boolean;
  confidence: number;
  needsReview: boolean;
}

function asArray(v: string | string[] | null | undefined): string[] {
  if (!v || v === "") return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return [String(v)];
}

function toAsset(e: HistoryEntry): Asset {
  const f = e.fields ?? {};
  const funnelStage = String(f.funnelStage?.value ?? "");
  return {
    entryId: e.entryId,
    title: e.title,
    url: e.url,
    contentType: e.contentType ?? "unknown",
    topics: asArray(f.topic?.value),
    funnelStage,
    industry: asArray(f.industry?.value),
    audience: asArray(f.audience?.value),
    jobFunction: asArray(f.jobFunction?.value),
    isPillar:
      funnelStage.includes("BOFU") &&
      (e.url.includes("/products/") || e.url.includes("/platform")),
    confidence: e.overallConfidence,
    needsReview: e.needsReview,
  };
}

// ---------------------------------------------------------------------------
// Edge types
// ---------------------------------------------------------------------------
type EdgeRel = "SIMILAR_TO" | "SUPPORTS_PILLAR" | "COMPETES_FOR_SERP";

interface Edge {
  from: string;
  to: string;
  rel: EdgeRel;
  weight: number;
  reason: string; // human-readable explanation
}

// ---------------------------------------------------------------------------
// Build in-memory content graph (same rules as pgGraph.ts buildContentEdges)
// ---------------------------------------------------------------------------
function buildEdges(assets: Asset[]): Edge[] {
  const edges: Edge[] = [];

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i];
      const b = assets[j];

      const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
      const sharedIndustry = a.industry.filter((v) => b.industry.includes(v));
      const sharedAudience = a.audience.filter((v) => b.audience.includes(v));
      const sameFunnel =
        a.funnelStage === b.funnelStage && a.funnelStage !== "";

      // SUPPORTS_PILLAR
      if (sharedTopics.length > 0) {
        if (b.isPillar && a.funnelStage.includes("TOFU")) {
          edges.push({
            from: a.entryId,
            to: b.entryId,
            rel: "SUPPORTS_PILLAR",
            weight: 0.9,
            reason: `topic: ${sharedTopics.join(", ")}`,
          });
        } else if (a.isPillar && b.funnelStage.includes("TOFU")) {
          edges.push({
            from: b.entryId,
            to: a.entryId,
            rel: "SUPPORTS_PILLAR",
            weight: 0.9,
            reason: `topic: ${sharedTopics.join(", ")}`,
          });
        }
      }

      // COMPETES_FOR_SERP
      if (sharedTopics.length > 0 && sameFunnel && !a.isPillar && !b.isPillar) {
        const weight = Math.min(0.9, 0.5 + sharedTopics.length * 0.2);
        edges.push({
          from: a.entryId,
          to: b.entryId,
          rel: "COMPETES_FOR_SERP",
          weight,
          reason: `same topic (${sharedTopics.join(", ")}) + same funnel (${a.funnelStage})`,
        });
      }

      // SIMILAR_TO
      const overlapScore =
        sharedTopics.length * 0.4 +
        sharedIndustry.length * 0.3 +
        sharedAudience.length * 0.2 +
        (sameFunnel ? 0.1 : 0);

      if (overlapScore >= 0.5) {
        const reasons: string[] = [];
        if (sharedTopics.length)
          reasons.push(`topic: ${sharedTopics.join(", ")}`);
        if (sharedIndustry.length)
          reasons.push(`industry: ${sharedIndustry.join(", ")}`);
        if (sharedAudience.length)
          reasons.push(`audience: ${sharedAudience.join(", ")}`);
        if (sameFunnel) reasons.push(`funnel: ${a.funnelStage}`);
        edges.push({
          from: a.entryId,
          to: b.entryId,
          rel: "SIMILAR_TO",
          weight: Math.min(0.95, overlapScore),
          reason: reasons.join(" | "),
        });
      }
    }
  }

  return edges;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

const relColor: Record<EdgeRel, string> = {
  SIMILAR_TO: CYAN,
  SUPPORTS_PILLAR: GREEN,
  COMPETES_FOR_SERP: RED,
};

const relIcon: Record<EdgeRel, string> = {
  SIMILAR_TO: "~",
  SUPPORTS_PILLAR: "^",
  COMPETES_FOR_SERP: "!",
};

function shortId(id: string) {
  return id.slice(0, 8) + "..";
}
function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
function truncate(s: string, max = 50) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function printAsset(a: Asset, prefix = "  ") {
  const flag = a.needsReview ? ` ${YELLOW}[needs review]${RESET}` : "";
  console.log(`${prefix}${BOLD}${truncate(a.title, 55)}${RESET}${flag}`);
  console.log(`${prefix}  ${DIM}${a.url}${RESET}`);
  const tags: string[] = [];
  if (a.topics.length) tags.push(`topic: ${a.topics.join(", ")}`);
  if (a.funnelStage)
    tags.push(`funnel: ${a.funnelStage.replace(/\s*\(.*\)/, "")}`);
  if (a.industry.length) tags.push(`industry: ${a.industry.join(", ")}`);
  if (a.jobFunction.length) tags.push(`fn: ${a.jobFunction.join(", ")}`);
  if (tags.length)
    console.log(`${prefix}  ${DIM}${tags.join("  •  ")}${RESET}`);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdOverview(assets: Asset[], edges: Edge[]) {
  console.log(`\n${BOLD}Content Graph Overview${RESET}\n`);
  console.log(`  Pages indexed: ${assets.length}`);
  console.log(`  Edges built:   ${edges.length}`);

  const byCt: Record<string, number> = {};
  const byFunnel: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  for (const a of assets) {
    byCt[a.contentType] = (byCt[a.contentType] ?? 0) + 1;
    byFunnel[a.funnelStage || "(unknown)"] =
      (byFunnel[a.funnelStage || "(unknown)"] ?? 0) + 1;
    for (const t of a.topics) byTopic[t] = (byTopic[t] ?? 0) + 1;
  }

  console.log(`\n${BOLD}Content type${RESET}`);
  for (const [ct, n] of Object.entries(byCt).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${ct}`);
  }

  console.log(`\n${BOLD}Funnel distribution${RESET}`);
  for (const [f, n] of Object.entries(byFunnel).sort((a, b) => b[1] - a[1])) {
    const bar = "█".repeat(Math.round((n / assets.length) * 20));
    console.log(
      `  ${String(n).padStart(3)}  ${truncate(f, 40).padEnd(42)} ${bar}`,
    );
  }

  console.log(`\n${BOLD}Topics${RESET}`);
  for (const [t, n] of Object.entries(byTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)) {
    console.log(`  ${String(n).padStart(3)}  ${t}`);
  }

  const byRel: Record<string, number> = {};
  for (const e of edges) byRel[e.rel] = (byRel[e.rel] ?? 0) + 1;
  console.log(`\n${BOLD}Graph edges${RESET}`);
  for (const [rel, n] of Object.entries(byRel)) {
    const c = relColor[rel as EdgeRel] ?? RESET;
    console.log(
      `  ${String(n).padStart(3)}  ${c}${relIcon[rel as EdgeRel] ?? "?"} ${rel}${RESET}`,
    );
  }
  console.log("");
}

function cmdRelated(
  entryId: string,
  assets: Asset[],
  edges: Edge[],
  filterRels?: string[],
) {
  const map = new Map(assets.map((a) => [a.entryId, a]));
  const self = map.get(entryId);

  if (!self) {
    // Try partial match
    const partial = assets.find(
      (a) => a.entryId.startsWith(entryId) || a.url.includes(entryId),
    );
    if (partial) return cmdRelated(partial.entryId, assets, edges, filterRels);
    console.error(`Entry "${entryId}" not found in history.`);
    return;
  }

  const rels = new Set(
    filterRels ?? ["SIMILAR_TO", "SUPPORTS_PILLAR", "COMPETES_FOR_SERP"],
  );

  const connected = edges
    .filter(
      (e) =>
        e.rel &&
        rels.has(e.rel) &&
        (e.from === self.entryId || e.to === self.entryId),
    )
    .map((e) => ({
      other: map.get(e.from === self.entryId ? e.to : e.from)!,
      rel: e.rel,
      weight: e.weight,
      reason: e.reason,
    }))
    .filter((x) => x.other)
    .sort((a, b) => b.weight - a.weight);

  console.log(`\n${BOLD}${self.title}${RESET}`);
  console.log(`  ${DIM}${self.url}  •  ${self.contentType}${RESET}`);
  printAsset(self);
  console.log("");

  if (connected.length === 0) {
    console.log("  No connected pages found.\n");
    return;
  }

  const grouped: Record<string, typeof connected> = {};
  for (const c of connected) {
    grouped[c.rel] = grouped[c.rel] ?? [];
    grouped[c.rel].push(c);
  }

  for (const [rel, items] of Object.entries(grouped)) {
    const c = relColor[rel as EdgeRel] ?? RESET;
    const icon = relIcon[rel as EdgeRel] ?? "?";
    console.log(`${c}${BOLD}${icon} ${rel}${RESET} (${items.length})`);
    for (const item of items) {
      console.log(
        `  [${pct(item.weight)}] ${BOLD}${truncate(item.other.title, 50)}${RESET}`,
      );
      console.log(`       ${DIM}${item.other.url}${RESET}`);
      console.log(`       ${DIM}${item.reason}${RESET}`);
    }
    console.log("");
  }
}

function cmdTopic(topic: string, assets: Asset[]) {
  const matched = assets.filter((a) =>
    a.topics.some((t) => t.toLowerCase().includes(topic.toLowerCase())),
  );

  if (matched.length === 0) {
    console.log(`\nNo pages found for topic matching "${topic}".\n`);
    return;
  }

  console.log(
    `\n${BOLD}Pages tagged with "${topic}"${RESET} (${matched.length})\n`,
  );
  const byFunnel: Record<string, Asset[]> = {};
  for (const a of matched) {
    const f = a.funnelStage || "(unknown)";
    byFunnel[f] = byFunnel[f] ?? [];
    byFunnel[f].push(a);
  }

  for (const [f, pages] of Object.entries(byFunnel)) {
    console.log(`${BOLD}${f}${RESET} (${pages.length})`);
    for (const p of pages) printAsset(p);
    console.log("");
  }
}

function cmdGaps(assets: Asset[], edges: Edge[]) {
  // Find topics that have TOFU pages but no SUPPORTS_PILLAR edge pointing to a pillar
  const tofuTopics = new Map<string, Asset[]>();
  for (const a of assets) {
    if (a.funnelStage.includes("TOFU")) {
      for (const t of a.topics) {
        if (!tofuTopics.has(t)) tofuTopics.set(t, []);
        tofuTopics.get(t)!.push(a);
      }
    }
  }

  const backedTopics = new Set<string>();
  const map = new Map(assets.map((a) => [a.entryId, a]));
  for (const e of edges) {
    if (e.rel === "SUPPORTS_PILLAR") {
      const pillar = map.get(e.to);
      if (pillar) for (const t of pillar.topics) backedTopics.add(t);
    }
  }

  const gaps = [...tofuTopics.entries()]
    .filter(([t]) => !backedTopics.has(t))
    .sort((a, b) => b[1].length - a[1].length);

  console.log(
    `\n${BOLD}Content gaps — TOFU topics without a pillar page${RESET}\n`,
  );

  if (gaps.length === 0) {
    console.log(
      `  ${GREEN}No gaps found. All TOFU topics have pillar backing.${RESET}\n`,
    );
    return;
  }

  for (const [topic, pages] of gaps) {
    console.log(
      `  ${YELLOW}${BOLD}${topic}${RESET}  ${DIM}(${pages.length} TOFU page${pages.length > 1 ? "s" : ""}, no pillar)${RESET}`,
    );
    for (const p of pages.slice(0, 3)) {
      console.log(`    ${DIM}${p.url}${RESET}`);
    }
    if (pages.length > 3)
      console.log(`    ${DIM}...and ${pages.length - 3} more${RESET}`);
  }
  console.log(
    `\n  ${RED}Action:${RESET} Create pillar pages for these topics, or tag an existing page as a pillar.\n`,
  );
}

function cmdSerp(assets: Asset[], edges: Edge[]) {
  const serpEdges = edges
    .filter((e) => e.rel === "COMPETES_FOR_SERP")
    .sort((a, b) => b.weight - a.weight);

  console.log(
    `\n${BOLD}SERP competition — pages targeting the same topic + funnel stage${RESET}\n`,
  );

  if (serpEdges.length === 0) {
    console.log(`  ${GREEN}No SERP competition detected.${RESET}\n`);
    return;
  }

  const map = new Map(assets.map((a) => [a.entryId, a]));

  for (const e of serpEdges) {
    const a = map.get(e.from);
    const b = map.get(e.to);
    if (!a || !b) continue;

    console.log(`  ${RED}${BOLD}[${pct(e.weight)} overlap]${RESET}`);
    console.log(`    ${truncate(a.title, 55)} ${DIM}${a.url}${RESET}`);
    console.log(`    ${truncate(b.title, 55)} ${DIM}${b.url}${RESET}`);
    console.log(`    ${DIM}${e.reason}${RESET}`);
    console.log("");
  }

  console.log(
    `  ${YELLOW}${serpEdges.length} competing pair${serpEdges.length > 1 ? "s" : ""} detected.${RESET}`,
  );
  console.log(`  Consider consolidating or differentiating these pages.\n`);
}

function cmdMermaid(assets: Asset[], edges: Edge[], focusId?: string) {
  const map = new Map(assets.map((a) => [a.entryId, a]));

  // If focus, only show edges involving that node
  const displayEdges = focusId
    ? edges.filter((e) => e.from === focusId || e.to === focusId)
    : edges;

  const nodeIds = new Set<string>();
  for (const e of displayEdges) {
    nodeIds.add(e.from);
    nodeIds.add(e.to);
  }

  const relStyle: Record<EdgeRel, string> = {
    SIMILAR_TO: "---",
    SUPPORTS_PILLAR: "-->",
    COMPETES_FOR_SERP: "-.-x",
  };

  console.log("graph LR");

  // Node definitions
  for (const id of nodeIds) {
    const a = map.get(id);
    const label = a ? truncate(a.title, 35).replace(/"/g, "'") : shortId(id);
    const shape = a?.isPillar ? `["${label}"]` : `("${label}")`;
    console.log(`  ${shortId(id)}${shape}`);
  }

  console.log("");

  // Edges
  for (const e of displayEdges) {
    const style = relStyle[e.rel] ?? "---";
    console.log(`  ${shortId(e.from)} ${style}|${e.rel}| ${shortId(e.to)}`);
  }

  // Styling
  console.log("");
  console.log("  classDef pillar fill:#4ade80,stroke:#166534");
  console.log("  classDef competing fill:#fca5a5,stroke:#991b1b");
  for (const id of nodeIds) {
    const a = map.get(id);
    if (a?.isPillar) console.log(`  class ${shortId(id)} pillar`);
  }
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);

function flag(name: string) {
  return argv.includes(name);
}
function arg(name: string) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

const history = loadHistory();
const assets = Object.values(history).map(toAsset);
const edges = buildEdges(assets);

if (assets.length === 0) {
  console.log(
    "\nNo classification history found at .cache/classification-history.json",
  );
  console.log("Run classify-pillar-pages.ts first to build the graph.\n");
  process.exit(0);
}

const relatedId = arg("--related");
const topicArg = arg("--topic");
const mermaidId = arg("--mermaid");

if (relatedId !== undefined) {
  const relsArg = arg("--rels");
  const rels = relsArg ? relsArg.split(",").map((s) => s.trim()) : undefined;
  cmdRelated(relatedId, assets, edges, rels);
} else if (topicArg !== undefined) {
  cmdTopic(topicArg, assets);
} else if (flag("--gaps")) {
  cmdGaps(assets, edges);
} else if (flag("--serp")) {
  cmdSerp(assets, edges);
} else if (flag("--mermaid")) {
  cmdMermaid(assets, edges, mermaidId !== "--mermaid" ? mermaidId : undefined);
} else if (flag("--overview") || argv.length === 0) {
  cmdOverview(assets, edges);
} else {
  console.log("\nUsage:");
  console.log("  --overview                   Full taxonomy + edge summary");
  console.log("  --related <entryId>          Pages connected to an entry");
  console.log("  --topic <name>               All pages for a topic");
  console.log("  --gaps                       Topics with TOFU but no pillar");
  console.log("  --serp                       SERP cannibalization risks");
  console.log(
    "  --mermaid [entryId]          Mermaid diagram (pipe to .mmd file)",
  );
  console.log("");
}
