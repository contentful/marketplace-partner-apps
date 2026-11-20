import { db } from "../storage/index.js";
import {
  expandPersonaCandidates,
  expandFunnelCandidates,
  expandIndustryCandidates,
  expandTopicCandidates,
} from "../utils/taxonomyNormalize.js";

export type NodeType = "asset" | "topic" | "persona" | "industry" | "funnel";

/**
 * Edge relationship types used in the content graph.
 *
 * Taxonomy edges (asset → taxonomy node):
 *   HAS_TOPIC            — page is tagged with a topic
 *   TARGETS_PERSONA      — page targets a job level/function persona
 *   IN_INDUSTRY          — page speaks to an industry vertical
 *   AT_FUNNEL_STAGE      — page belongs to a funnel stage
 *
 * Content-to-content edges (asset → asset):
 *   SIMILAR_TO           — pages share ≥2 taxonomy fields (topic + funnel stage, etc.)
 *   SUPPORTS_PILLAR      — a blog/guide page that backs a pillar page (same topic, TOFU→product)
 *   COMPETES_FOR_SERP    — pages targeting the same topic + funnel stage (internal cannibalization risk)
 *   REFERENCES_CASE_STUDY — a solution/product page that cites a specific case study
 */
export type EdgeRel =
  | "HAS_TOPIC"
  | "TARGETS_PERSONA"
  | "IN_INDUSTRY"
  | "AT_FUNNEL_STAGE"
  | "SIMILAR_TO"
  | "SUPPORTS_PILLAR"
  | "COMPETES_FOR_SERP"
  | "REFERENCES_CASE_STUDY";

export type SearchFilters = {
  persona?: string;
  funnel?: string;
  industry?: string;
  topic?: string;
  limit?: number;
};

let ensured = false;
async function ensureGraphTables() {
  if (ensured) return;
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ No DATABASE_URL found. Graph operations will fail.");
    return; // Or throw, but returning might be safer for some ops
  }
  // Create minimal schema for nodes/edges with indexes
  await db.query(`
    create table if not exists graph_nodes(
      id text primary key,
      type text not null,
      label text,
      url text,
      created_at timestamptz default now()
    );
    create table if not exists graph_edges(
      src_id text not null,
      rel text not null,
      dst_id text not null,
      weight real not null default 1,
      source text,
      updated_at timestamptz default now(),
      primary key (src_id, rel, dst_id)
    );
    create index if not exists idx_nodes_type on graph_nodes(type);
    create index if not exists idx_edges_src_rel on graph_edges(src_id, rel);
    create index if not exists idx_edges_dst_rel on graph_edges(dst_id, rel);
    create index if not exists idx_edges_rel_weight on graph_edges(rel, weight desc);
  `);
  // Ensure url column exists on older installs
  await db.query(`alter table graph_nodes add column if not exists url text`);
  ensured = true;
}

async function upsertNode(
  id: string,
  type: NodeType,
  label?: string,
  url?: string,
) {
  if (!process.env.DATABASE_URL) return;
  await ensureGraphTables();
  await db.query(
    `insert into graph_nodes(id, type, label, url)
     values($1, $2, $3, $4)
     on conflict (id) do update set label = excluded.label, url = coalesce(excluded.url, graph_nodes.url)`,
    [id, type, label ?? null, url ?? null],
  );
}

async function upsertEdge(
  src: string,
  rel: string,
  dst: string,
  weight: number,
  source?: string,
) {
  if (!process.env.DATABASE_URL) return;
  await ensureGraphTables();
  const w = Math.max(0, Math.min(1, weight ?? 0));
  await db.query(
    `insert into graph_edges(src_id, rel, dst_id, weight, source, updated_at)
     values($1, $2, $3, $4, $5, now())
     on conflict (src_id, rel, dst_id)
     do update set weight = excluded.weight, source = excluded.source, updated_at = now()`,
    [src, rel, dst, w, source ?? null],
  );
}

export async function upsertAssetNode(
  entryId: string,
  data?: { title?: string; url?: string },
) {
  await upsertNode(entryId, "asset", data?.title, data?.url);
}

export async function upsertTaxonomyNodes(labels: {
  topic?: string;
  persona?: string;
  industry?: string;
  funnelStage?: string;
}) {
  if (labels.topic)
    await upsertNode(`topic:${labels.topic}`, "topic", labels.topic);
  if (labels.persona)
    await upsertNode(`persona:${labels.persona}`, "persona", labels.persona);
  if (labels.industry)
    await upsertNode(
      `industry:${labels.industry}`,
      "industry",
      labels.industry,
    );
  if (labels.funnelStage)
    await upsertNode(
      `funnel:${labels.funnelStage}`,
      "funnel",
      labels.funnelStage,
    );
}

export async function linkAssetToLabels(
  entryId: string,
  labels: {
    topic?: string;
    persona?: string;
    industry?: string;
    funnelStage?: string;
  },
  confidence?: Partial<{
    topic: number;
    persona: number;
    industry: number;
    funnelStage: number;
  }>,
) {
  if (labels.topic)
    await upsertEdge(
      entryId,
      "HAS_TOPIC",
      `topic:${labels.topic}`,
      confidence?.topic ?? 0.8,
      "classifier",
    );
  if (labels.persona)
    await upsertEdge(
      entryId,
      "TARGETS_PERSONA",
      `persona:${labels.persona}`,
      confidence?.persona ?? 0.8,
      "classifier",
    );
  if (labels.industry)
    await upsertEdge(
      entryId,
      "IN_INDUSTRY",
      `industry:${labels.industry}`,
      confidence?.industry ?? 0.8,
      "classifier",
    );
  if (labels.funnelStage)
    await upsertEdge(
      entryId,
      "AT_FUNNEL_STAGE",
      `funnel:${labels.funnelStage}`,
      confidence?.funnelStage ?? 0.8,
      "classifier",
    );
}

export async function searchGraph(filters: SearchFilters) {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ No DATABASE_URL found. Returning empty search results.");
    return [];
  }
  await ensureGraphTables();
  const { persona, funnel, industry, topic } = filters;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;

  // Build dynamic WHERE with correctly indexed positional params
  const conditions: string[] = [];
  const args: unknown[] = [limit]; // $1 reserved for limit

  function addCondList(rel: string, candidates: string[]) {
    if (!candidates || candidates.length === 0) return;
    for (const dst of candidates) {
      const relIdx = args.push(rel);
      const dstIdx = args.push(dst);
      conditions.push(`(e.rel = $${relIdx} and e.dst_id = $${dstIdx})`);
    }
  }

  addCondList("TARGETS_PERSONA", expandPersonaCandidates(persona));
  addCondList("AT_FUNNEL_STAGE", expandFunnelCandidates(funnel));
  addCondList("IN_INDUSTRY", expandIndustryCandidates(industry));
  addCondList("HAS_TOPIC", expandTopicCandidates(topic));

  const where = conditions.length ? `where ${conditions.join(" or ")}` : "";

  const query = `
    select e.src_id as id,
           coalesce(n.label, e.src_id) as label,
           n.url as url,
           sum(e.weight) as score,
           array_agg(e.dst_id order by e.weight desc) as whys
    from graph_edges e
    left join graph_nodes n on n.id = e.src_id
    ${where}
    group by e.src_id, n.label, n.url
    order by score desc
    limit $1`;

  const result = await db.query(query, args);

  return result.rows.map((r: Record<string, unknown>) => ({
    id: r["id"] as string,
    score: Number(r["score"]),
    label: (r["label"] as string) ?? r["id"],
    url: (r["url"] as string) || undefined,
    why: ((r["whys"] as string[] | null) || []).map((w) => w),
  }));
}

// ---------------------------------------------------------------------------
// Content-to-content edge building
// Called after classifying a batch of pages to wire up relationships.
// ---------------------------------------------------------------------------

/**
 * Build content-to-content edges for a batch of classified assets.
 *
 * Rules (all non-blocking — failures are logged, not thrown):
 *
 *  SUPPORTS_PILLAR   weight=0.9  — TOFU/blog page + pillar page share same topic.
 *                                   Blog → Product (same topic, different funnel).
 *  SIMILAR_TO        weight=0.7  — Two pages share ≥ 2 overlapping taxonomy tags.
 *                                   (topic ∩ industry, topic ∩ funnel, etc.)
 *  COMPETES_FOR_SERP weight=0.8  — Two non-pillar pages share the SAME topic AND
 *                                   the SAME funnel stage → cannibalization risk.
 */
export async function buildContentEdges(
  assets: Array<{
    entryId: string;
    title: string;
    url: string;
    contentType: string;
    topics: string[];
    funnelStage: string;
    industry: string[];
    audience: string[];
    isPillar?: boolean; // true if tagged as a pillar page
  }>,
): Promise<{ edgesAdded: number }> {
  if (!process.env.DATABASE_URL) return { edgesAdded: 0 };
  if (assets.length < 2) return { edgesAdded: 0 };

  await ensureGraphTables();
  let edgesAdded = 0;

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i];
      const b = assets[j];

      const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
      const sharedIndustry = a.industry.filter((v) => b.industry.includes(v));
      const sharedAudience = a.audience.filter((v) => b.audience.includes(v));
      const sameFunnel = a.funnelStage === b.funnelStage;

      // SUPPORTS_PILLAR: blog/guide (TOFU) → product pillar page (same topic)
      if (sharedTopics.length > 0) {
        if (b.isPillar && a.funnelStage === "Awareness (TOFU)") {
          await upsertEdge(
            a.entryId,
            "SUPPORTS_PILLAR",
            b.entryId,
            0.9,
            "classifier",
          );
          edgesAdded++;
        } else if (a.isPillar && b.funnelStage === "Awareness (TOFU)") {
          await upsertEdge(
            b.entryId,
            "SUPPORTS_PILLAR",
            a.entryId,
            0.9,
            "classifier",
          );
          edgesAdded++;
        }
      }

      // COMPETES_FOR_SERP: same topic AND same funnel stage, neither is a pillar
      if (sharedTopics.length > 0 && sameFunnel && !a.isPillar && !b.isPillar) {
        const weight = Math.min(0.9, 0.5 + sharedTopics.length * 0.2);
        await upsertEdge(
          a.entryId,
          "COMPETES_FOR_SERP",
          b.entryId,
          weight,
          "classifier",
        );
        edgesAdded++;
      }

      // SIMILAR_TO: ≥2 overlapping dimensions (topic + industry, topic + audience, etc.)
      const overlapScore =
        sharedTopics.length * 0.4 +
        sharedIndustry.length * 0.3 +
        sharedAudience.length * 0.2 +
        (sameFunnel ? 0.1 : 0);

      if (overlapScore >= 0.5) {
        const weight = Math.min(0.95, overlapScore);
        await upsertEdge(
          a.entryId,
          "SIMILAR_TO",
          b.entryId,
          weight,
          "classifier",
        );
        edgesAdded++;
      }
    }
  }

  return { edgesAdded };
}

/**
 * Find related content for a given entry ID.
 * Returns pages connected by SIMILAR_TO or SUPPORTS_PILLAR edges,
 * ranked by edge weight. Used by the Contentful sidebar app and API.
 */
export async function getRelatedContent(
  entryId: string,
  options?: { limit?: number; rels?: EdgeRel[] },
): Promise<
  Array<{
    id: string;
    label: string;
    url?: string;
    rel: string;
    weight: number;
  }>
> {
  if (!process.env.DATABASE_URL) return [];
  await ensureGraphTables();

  const rels = options?.rels ?? [
    "SIMILAR_TO",
    "SUPPORTS_PILLAR",
    "COMPETES_FOR_SERP",
  ];
  const limit = options?.limit ?? 10;
  const placeholders = rels.map((_, i) => `$${i + 2}`).join(", ");

  const result = await db.query(
    `select e.dst_id as id,
            coalesce(n.label, e.dst_id) as label,
            n.url as url,
            e.rel as rel,
            e.weight as weight
     from graph_edges e
     left join graph_nodes n on n.id = e.dst_id
     where e.src_id = $1 and e.rel in (${placeholders})
     union
     select e.src_id as id,
            coalesce(n.label, e.src_id) as label,
            n.url as url,
            e.rel as rel,
            e.weight as weight
     from graph_edges e
     left join graph_nodes n on n.id = e.src_id
     where e.dst_id = $1 and e.rel in (${placeholders})
     order by weight desc
     limit $${rels.length + 2}`,
    [entryId, ...rels, limit],
  );

  return result.rows.map((r: Record<string, unknown>) => ({
    id: r["id"] as string,
    label: (r["label"] as string) ?? r["id"],
    url: r["url"] as string | undefined,
    rel: r["rel"] as string,
    weight: Number(r["weight"]),
  }));
}

/**
 * Return a content gap analysis: topics that have TOFU coverage but no
 * BOFU/MOFU product page backing them (i.e., no SUPPORTS_PILLAR edge).
 */
export async function getContentGaps(): Promise<
  Array<{ topic: string; tofuCount: number }>
> {
  if (!process.env.DATABASE_URL) return [];
  await ensureGraphTables();

  const result = await db.query(`
    with tofu_topics as (
      select e1.dst_id as topic_id, count(distinct e1.src_id) as tofu_count
      from graph_edges e1
      join graph_edges e2 on e2.src_id = e1.src_id and e2.rel = 'AT_FUNNEL_STAGE'
        and e2.dst_id ilike '%tofu%'
      where e1.rel = 'HAS_TOPIC'
      group by e1.dst_id
    ),
    backed_topics as (
      select distinct e.rel, n.id as topic_id
      from graph_edges e
      join graph_nodes n on n.id in (
        select dst_id from graph_edges where rel = 'HAS_TOPIC'
      )
      where e.rel = 'SUPPORTS_PILLAR'
    )
    select tt.topic_id, tt.tofu_count,
           replace(tt.topic_id, 'topic:', '') as topic
    from tofu_topics tt
    left join backed_topics bt on bt.topic_id = tt.topic_id
    where bt.topic_id is null
    order by tt.tofu_count desc
    limit 20
  `);

  return result.rows.map((r: Record<string, unknown>) => ({
    topic: r["topic"] as string,
    tofuCount: Number(r["tofu_count"]),
  }));
}

export async function contentMix() {
  if (!process.env.DATABASE_URL) return { totalAssets: 0, mix: [] };
  await ensureGraphTables();
  const result = await db.query(
    `select replace(e.dst_id, 'funnel:', '') as stage, count(*)::int as count
     from graph_edges e
     where e.rel = 'AT_FUNNEL_STAGE' and e.dst_id like 'funnel:%'
     group by stage
     order by count desc`,
  );
  const rows = result.rows;
  const total =
    rows.reduce(
      (a: number, r: Record<string, unknown>) => a + Number(r["count"]),
      0,
    ) || 1;
  const mix = rows.map((r: Record<string, unknown>) => ({
    stage: r["stage"] as string,
    count: Number(r["count"]),
    pct: Number(r["count"]) / total,
  }));
  return { totalAssets: total, mix };
}
