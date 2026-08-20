import { randomUUID } from "crypto";
import { db, hasPostgres } from "../storage/index.js";
import { CLASSIFICATION_QUEUE_MAX_ATTEMPTS } from "../config/classifierPipeline.js";

export interface ClassificationJobPayload {
  entryId: string;
  contentType?: string;
  locale?: string;
  webhookBody?: unknown;
}

export interface ClassificationJob {
  id: string;
  entryId: string;
  contentType?: string;
  locale?: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  payload: ClassificationJobPayload;
  result?: unknown;
  lastError?: string;
  createdAt?: string;
  claimedAt?: string;
  completedAt?: string;
}

export interface HumanReviewRecord {
  jobId?: string;
  entryId: string;
  title?: string;
  url?: string;
  overallConfidence: number;
  weakestSemantic: number;
  reasons: string[];
  classification: unknown;
}

let schemaEnsured = false;

async function ensureSchema(): Promise<boolean> {
  if (schemaEnsured) return true;
  if (!hasPostgres) return false;

  await db.query(`
    create table if not exists classification_jobs (
      id text primary key,
      entry_id text not null,
      content_type text,
      locale text,
      payload jsonb not null,
      status text not null default 'pending',
      attempt_count int not null default 0,
      max_attempts int not null default 5,
      available_at timestamptz not null default now(),
      claimed_at timestamptz,
      completed_at timestamptz,
      last_error text,
      result jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists idx_classification_jobs_pending
      on classification_jobs (status, available_at, created_at);

    create table if not exists classification_review_queue (
      id serial primary key,
      job_id text,
      entry_id text not null,
      title text,
      url text,
      overall_conf real,
      weakest_semantic real,
      reasons jsonb,
      classification jsonb,
      created_at timestamptz not null default now(),
      resolved_at timestamptz
    );
    create index if not exists idx_classification_review_queue_open
      on classification_review_queue (resolved_at, created_at);
  `);

  await db.query(`
    alter table classification_jobs
      add column if not exists result jsonb;
  `);

  schemaEnsured = true;
  return true;
}

export async function enqueueClassificationJob(
  payload: ClassificationJobPayload,
): Promise<{ id: string } | null> {
  if (!(await ensureSchema())) return null;

  const id = randomUUID();
  await db.query(
    `insert into classification_jobs
      (id, entry_id, content_type, locale, payload, max_attempts)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      payload.entryId,
      payload.contentType ?? null,
      payload.locale ?? null,
      JSON.stringify(payload),
      CLASSIFICATION_QUEUE_MAX_ATTEMPTS,
    ],
  );

  return { id };
}

export async function claimClassificationJobs(
  limit: number,
): Promise<ClassificationJob[]> {
  if (!(await ensureSchema())) return [];

  const result = await db.query(
    `with next_jobs as (
       select id
       from classification_jobs
       where status = 'pending'
         and available_at <= now()
       order by created_at asc
       limit $1
       for update skip locked
     )
     update classification_jobs jobs
        set status = 'processing',
            claimed_at = now(),
            updated_at = now(),
            attempt_count = attempt_count + 1
      from next_jobs
      where jobs.id = next_jobs.id
      returning jobs.id, jobs.entry_id, jobs.content_type, jobs.locale,
                jobs.status, jobs.attempt_count, jobs.max_attempts, jobs.payload`,
    [limit],
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    entryId: row.entry_id as string,
    contentType: (row.content_type ?? undefined) as string | undefined,
    locale: (row.locale ?? undefined) as string | undefined,
    status: row.status as string,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    payload: row.payload as ClassificationJobPayload,
  })) as ClassificationJob[];
}

export async function completeClassificationJob(
  jobId: string,
  status: "completed" | "needs_review" = "completed",
  result?: unknown,
): Promise<void> {
  if (!(await ensureSchema())) return;
  await db.query(
    `update classification_jobs
        set status = $2,
            result = coalesce($3::jsonb, result),
            completed_at = now(),
            updated_at = now()
      where id = $1`,
    [jobId, status, result ? JSON.stringify(result) : null],
  );
}

export async function retryClassificationJob(
  jobId: string,
  error: string,
  attemptCount: number,
): Promise<void> {
  if (!(await ensureSchema())) return;

  const delaySeconds = Math.min(300, Math.max(15, 2 ** attemptCount * 10));
  await db.query(
    `update classification_jobs
        set status = 'pending',
            available_at = now() + ($2 || ' seconds')::interval,
            updated_at = now(),
            last_error = $3
      where id = $1`,
    [jobId, String(delaySeconds), error],
  );
}

export async function failClassificationJob(
  jobId: string,
  error: string,
): Promise<void> {
  if (!(await ensureSchema())) return;
  await db.query(
    `update classification_jobs
        set status = 'failed',
            updated_at = now(),
            last_error = $2
      where id = $1`,
    [jobId, error],
  );
}

export async function getClassificationJob(
  jobId: string,
): Promise<ClassificationJob | null> {
  if (!(await ensureSchema())) return null;

  const result = await db.query(
    `select id, entry_id, content_type, locale, status, attempt_count, max_attempts,
            payload, last_error, result, created_at, claimed_at, completed_at
       from classification_jobs
      where id = $1
      limit 1`,
    [jobId],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    entryId: row.entry_id,
    contentType: row.content_type ?? undefined,
    locale: row.locale ?? undefined,
    status: row.status,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    payload: row.payload,
    result: row.result ?? undefined,
    lastError: row.last_error ?? undefined,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : undefined,
    claimedAt: row.claimed_at
      ? new Date(row.claimed_at).toISOString()
      : undefined,
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : undefined,
  };
}

export async function queueHumanReview(
  record: HumanReviewRecord,
): Promise<void> {
  if (!(await ensureSchema())) return;
  await db.query(
    `insert into classification_review_queue
      (job_id, entry_id, title, url, overall_conf, weakest_semantic, reasons, classification)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      record.jobId ?? null,
      record.entryId,
      record.title ?? null,
      record.url ?? null,
      record.overallConfidence,
      record.weakestSemantic,
      JSON.stringify(record.reasons),
      JSON.stringify(record.classification),
    ],
  );
}

export async function resolveHumanReview(entryId: string): Promise<void> {
  if (!(await ensureSchema())) return;
  await db.query(
    `update classification_review_queue
        set resolved_at = now()
      where entry_id = $1
        and resolved_at is null`,
    [entryId],
  );
}

export async function sendReviewAlert(
  record: HumanReviewRecord,
): Promise<void> {
  const webhook = process.env.SLACK_REVIEW_WEBHOOK_URL;
  if (!webhook) return;

  const text = [
    `Human review required for ${record.title || record.entryId}`,
    `Entry: ${record.entryId}`,
    `Overall confidence: ${Math.round(record.overallConfidence * 100)}%`,
    `Weakest semantic confidence: ${Math.round(record.weakestSemantic * 100)}%`,
    `Reasons: ${record.reasons.join("; ")}`,
  ].join("\n");

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Alerting is non-blocking.
  }
}
