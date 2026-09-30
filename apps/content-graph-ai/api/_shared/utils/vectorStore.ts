/**
 * vectorStore.ts
 *
 * pgvector-backed embedding store for corrections.
 * Upgrades the file-based embedding cache in feedbackStore.ts to full
 * semantic search using PostgreSQL's pgvector extension.
 *
 * When DATABASE_URL is set and pgvector is enabled, this replaces the
 * file-scan loop in buildFewShotBlock() with a single SQL nearest-neighbour
 * query — making semantic few-shot selection scale to thousands of corrections.
 *
 * Setup (run once in your Postgres instance):
 *   CREATE EXTENSION IF NOT EXISTS vector;
 *
 * The table is created automatically on first use.
 *
 * Usage:
 *   import { upsertCorrectionVector, findSimilarCorrections } from './vectorStore.js';
 *
 *   // Store a correction's embedding:
 *   await upsertCorrectionVector(entryId, title, url, embedding, fields);
 *
 *   // Find nearest neighbours at query time:
 *   const similar = await findSimilarCorrections(queryEmbedding, { limit: 5 });
 */

import { db, hasPostgres } from "../storage/index.js";

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------
let ensured = false;

async function ensureSchema(): Promise<boolean> {
  if (ensured) return true;
  if (!hasPostgres) return false;
  try {
    // Enable pgvector extension (no-op if already enabled)
    await db.query(`create extension if not exists vector`);

    // Correction vectors table — 3072-dim for gemini-embedding-001
    await db.query(`
      create table if not exists correction_vectors (
        entry_id   text primary key,
        title      text,
        url        text,
        embed_text text,
        embedding  vector(3072),
        fields     jsonb,
        updated_at timestamptz default now()
      );
      create index if not exists idx_correction_vectors_embedding
        on correction_vectors using ivfflat (embedding vector_cosine_ops)
        with (lists = 10);
    `);
    ensured = true;
    return true;
  } catch (err: unknown) {
    // pgvector may not be installed — degrade gracefully to file-based store
    if (!(err instanceof Error) || !err.message?.includes("already exists")) {
      console.warn(
        "[VectorStore] pgvector not available — falling back to file-based embeddings:",
        err instanceof Error ? err.message : String(err),
      );
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert a correction's embedding into the vector table.
 * Called by embed-corrections.ts after computing the embedding.
 */
export async function upsertCorrectionVector(
  entryId: string,
  title: string,
  url: string,
  embedText: string,
  embedding: number[],
  fields: Record<string, string | string[]>,
): Promise<void> {
  if (!(await ensureSchema())) return;

  const vecStr = `[${embedding.join(",")}]`;
  try {
    await db.query(
      `insert into correction_vectors (entry_id, title, url, embed_text, embedding, fields, updated_at)
       values ($1, $2, $3, $4, $5::vector, $6, now())
       on conflict (entry_id) do update set
         title      = excluded.title,
         url        = excluded.url,
         embed_text = excluded.embed_text,
         embedding  = excluded.embedding,
         fields     = excluded.fields,
         updated_at = now()`,
      [entryId, title, url, embedText, vecStr, JSON.stringify(fields)],
    );
  } catch {
    /* non-fatal */
  }
}

/**
 * Find the N most similar corrections to a query embedding.
 * Returns corrections ranked by cosine similarity (nearest first).
 * Falls back to empty array if pgvector is not available.
 */
export async function findSimilarCorrections(
  queryEmbedding: number[],
  options?: { limit?: number; minSimilarity?: number },
): Promise<
  Array<{
    entryId: string;
    title: string;
    url: string;
    fields: Record<string, string | string[]>;
    similarity: number;
  }>
> {
  if (!(await ensureSchema())) return [];
  if (!queryEmbedding?.length) return [];

  const limit = options?.limit ?? 5;
  const minSim = options?.minSimilarity ?? 0.7;
  const vecStr = `[${queryEmbedding.join(",")}]`;

  try {
    const result = await db.query(
      `select entry_id, title, url, fields,
              1 - (embedding <=> $1::vector) as similarity
       from correction_vectors
       where 1 - (embedding <=> $1::vector) >= $2
       order by embedding <=> $1::vector
       limit $3`,
      [vecStr, minSim, limit],
    );

    return result.rows.map((r: Record<string, unknown>) => ({
      entryId: r["entry_id"] as string,
      title: r["title"] as string,
      url: r["url"] as string,
      fields: r["fields"] as Record<string, string | string[]>,
      similarity: Number(r["similarity"]),
    }));
  } catch {
    return [];
  }
}

/**
 * Check whether the vector table has any rows.
 * Used to decide whether to use pgvector or fall back to file-based search.
 */
export async function vectorStoreCount(): Promise<number> {
  if (!hasPostgres) return 0;
  try {
    await ensureSchema();
    const result = await db.query(
      `select count(*)::int as n from correction_vectors`,
    );
    return Number(result.rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}
