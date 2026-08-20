/**
 * observability.ts
 *
 * Structured classification run logging.
 * Every call to classifyContent() logs a row to `classification_runs` in Postgres.
 * When no DB is available, logs to process stdout only (non-blocking).
 *
 * Schema:
 *   classification_runs(
 *     id            serial primary key,
 *     entry_id      text not null,
 *     title         text,
 *     url           text,
 *     content_type  text,
 *     classified_at timestamptz default now(),
 *     duration_ms   int,
 *     overall_conf  real,
 *     needs_review  boolean,
 *     layer_decisions jsonb,   -- which layer made each field decision
 *     field_values    jsonb,   -- field → {value, confidence}
 *     consistency_warnings text[],
 *     model         text,
 *     has_correction boolean,
 *     prompt_version text,
 *     few_shot_examples jsonb,
 *     trace jsonb,
 *     token_usage jsonb,
 *     stage_timings jsonb,
 *     review_routing jsonb
 *   )
 *
 * Queries:
 *   SELECT field_values->>'topic'->'value', count(*)
 *   FROM classification_runs
 *   GROUP BY 1 ORDER BY 2 DESC;
 *
 *   SELECT avg(overall_conf), avg(duration_ms)
 *   FROM classification_runs
 *   WHERE classified_at > now() - interval '7 days';
 */

import { db, hasPostgres } from "../storage/index.js";
import {
  CLASSIFIER_REQUIRE_LANGSMITH,
  CLASSIFIER_REQUIRE_OTEL,
  CLASSIFIER_STRICT_VENDOR_MODE,
} from "../config/classifierPipeline.js";
import { VendorDependencyError } from "./classifierErrors.js";
import type { VendorTraceCollector } from "./vendorTrace.js";

const DEFAULT_VENDOR_EXPORT_TIMEOUT_MS = Number(
  process.env.CLASSIFIER_VENDOR_EXPORT_TIMEOUT_MS || 5000,
);
const LANGSMITH_EXPORT_TIMEOUT_MS = Number(
  process.env.CLASSIFIER_LANGSMITH_EXPORT_TIMEOUT_MS ||
    process.env.CLASSIFIER_VENDOR_EXPORT_TIMEOUT_MS ||
    10000,
);
const OTEL_EXPORT_TIMEOUT_MS = Number(
  process.env.CLASSIFIER_OTEL_EXPORT_TIMEOUT_MS ||
    process.env.CLASSIFIER_VENDOR_EXPORT_TIMEOUT_MS ||
    5000,
);

// ---------------------------------------------------------------------------
// Schema bootstrap (idempotent)
// ---------------------------------------------------------------------------
let schemaEnsured = false;

async function ensureSchema(): Promise<void> {
  if (schemaEnsured || !hasPostgres) return;
  try {
    await db.query(`
      create table if not exists classification_runs (
        id                serial primary key,
        entry_id          text not null,
        title             text,
        url               text,
        content_type      text,
        classified_at     timestamptz default now(),
        duration_ms       int,
        overall_conf      real,
        needs_review      boolean,
        layer_decisions   jsonb,
        field_values      jsonb,
        consistency_warnings text[],
        model             text,
        has_correction    boolean,
        prompt_version    text,
        few_shot_examples jsonb,
        trace             jsonb,
        token_usage       jsonb,
        stage_timings     jsonb,
        review_routing    jsonb
      );
      alter table classification_runs add column if not exists prompt_version text;
      alter table classification_runs add column if not exists few_shot_examples jsonb;
      alter table classification_runs add column if not exists trace jsonb;
      alter table classification_runs add column if not exists token_usage jsonb;
      alter table classification_runs add column if not exists stage_timings jsonb;
      alter table classification_runs add column if not exists review_routing jsonb;
      create index if not exists idx_runs_entry_id on classification_runs(entry_id);
      create index if not exists idx_runs_classified_at on classification_runs(classified_at);
      create index if not exists idx_runs_needs_review on classification_runs(needs_review) where needs_review = true;
    `);
    schemaEnsured = true;
  } catch {
    /* non-fatal — table may already exist */
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunRecord {
  entryId: string;
  title?: string;
  url?: string;
  contentType?: string;
  durationMs: number;
  overallConf: number;
  needsReview: boolean;
  layerDecisions?: Record<string, string>; // field → 'signal' | 'company' | 'ai' | 'profile' | 'correction'
  fieldValues?: Record<string, { value: unknown; confidence: number }>;
  consistencyWarnings?: string[];
  model?: string;
  hasCorrection?: boolean;
  promptVersion?: string;
  fewShotExamples?: Array<Record<string, unknown>>;
  trace?: Record<string, unknown>;
  tokenUsage?: Record<string, unknown>;
  stageTimings?: Record<string, number>;
  reviewRouting?: Record<string, unknown>;
  confidenceCalibration?: Record<string, number | boolean | string | null>;
  vendorTrace?: VendorTraceCollector;
}

function syncRecordVendorTrace(record: RunRecord): void {
  if (!record.vendorTrace) return;
  const snapshot = record.vendorTrace.snapshot();
  record.trace = {
    ...(record.trace || {}),
    vendors: snapshot.vendors,
    vendorCalls: snapshot.calls,
    wiring: snapshot.wiring,
  };
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    task,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

async function updatePersistedTrace(
  runId: number,
  record: RunRecord,
): Promise<void> {
  if (!hasPostgres) return;
  syncRecordVendorTrace(record);
  await db.query(`update classification_runs set trace = $2 where id = $1`, [
    runId,
    record.trace ? JSON.stringify(record.trace) : null,
  ]);
}

async function persistRun(record: RunRecord): Promise<number | null> {
  if (!hasPostgres) return null;

  const startedAt = Date.now();
  await ensureSchema();
  try {
    syncRecordVendorTrace(record);
    const result = await db.query(
      `insert into classification_runs
         (entry_id, title, url, content_type, duration_ms, overall_conf, needs_review,
          layer_decisions, field_values, consistency_warnings, model, has_correction,
          prompt_version, few_shot_examples, trace, token_usage, stage_timings, review_routing)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       returning id`,
      [
        record.entryId,
        record.title ?? null,
        record.url ?? null,
        record.contentType ?? null,
        record.durationMs,
        record.overallConf,
        record.needsReview,
        record.layerDecisions ? JSON.stringify(record.layerDecisions) : null,
        record.fieldValues ? JSON.stringify(record.fieldValues) : null,
        record.consistencyWarnings ?? null,
        record.model ?? null,
        record.hasCorrection ?? false,
        record.promptVersion ?? null,
        record.fewShotExamples ? JSON.stringify(record.fewShotExamples) : null,
        record.trace ? JSON.stringify(record.trace) : null,
        record.tokenUsage ? JSON.stringify(record.tokenUsage) : null,
        record.stageTimings ? JSON.stringify(record.stageTimings) : null,
        record.reviewRouting ? JSON.stringify(record.reviewRouting) : null,
      ],
    );
    const runId = Number(result.rows[0]?.id);
    record.vendorTrace?.recordCall({
      vendor: "postgres",
      service: "classification_runs",
      category: "observability",
      operation: "persist-classification-run",
      purpose: "store structured classification trace in Postgres",
      status: "ok",
      durationMs: Date.now() - startedAt,
      input: {
        entryId: record.entryId,
        contentType: record.contentType,
      },
      output: {
        needsReview: record.needsReview,
        overallConfidence: record.overallConf,
      },
    });
    record.vendorTrace?.link({
      from: "classification-result",
      to: "postgres",
      description: "final result is persisted into classification_runs",
    });
    if (Number.isFinite(runId)) {
      await updatePersistedTrace(runId, record);
      return runId;
    }
    return null;
  } catch (error) {
    record.vendorTrace?.recordCall({
      vendor: "postgres",
      service: "classification_runs",
      category: "observability",
      operation: "persist-classification-run",
      purpose: "store structured classification trace in Postgres",
      status: "error",
      durationMs: Date.now() - startedAt,
      input: {
        entryId: record.entryId,
        contentType: record.contentType,
      },
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function exportToVendors(record: RunRecord): Promise<void> {
  syncRecordVendorTrace(record);
  const { exportRunToLangSmith, exportRunToOtel } = await import(
    "./vendorObservability.js"
  );
  const results = await Promise.allSettled([
    (async () => {
      const startedAt = Date.now();
      try {
        const exported = await withTimeout(
          exportRunToLangSmith(record),
          LANGSMITH_EXPORT_TIMEOUT_MS || DEFAULT_VENDOR_EXPORT_TIMEOUT_MS,
        );
        record.vendorTrace?.recordCall({
          vendor: "langsmith",
          service: process.env.LANGSMITH_PROJECT || "content-graph",
          category: "observability",
          operation: "flush-pending-traces",
          purpose: "flush pending LangSmith traces produced by traceable steps",
          status: exported ? "ok" : "skipped",
          durationMs: Date.now() - startedAt,
          input: { entryId: record.entryId },
          output: {
            promptVersion: record.promptVersion,
            flushedPendingTraceBatches: exported,
          },
        });
        if (exported) {
          record.vendorTrace?.link({
            from: "classification-result",
            to: "langsmith",
            description:
              "pending LangSmith traces are flushed after classification completes",
          });
          syncRecordVendorTrace(record);
        }
      } catch (error) {
        record.vendorTrace?.recordCall({
          vendor: "langsmith",
          service: process.env.LANGSMITH_PROJECT || "content-graph",
          category: "observability",
          operation: "flush-pending-traces",
          purpose: "flush pending LangSmith traces produced by traceable steps",
          status: "error",
          durationMs: Date.now() - startedAt,
          input: { entryId: record.entryId },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    })(),
    (async () => {
      const startedAt = Date.now();
      try {
        const exported = await withTimeout(
          exportRunToOtel(record),
          OTEL_EXPORT_TIMEOUT_MS || DEFAULT_VENDOR_EXPORT_TIMEOUT_MS,
        );
        record.vendorTrace?.recordCall({
          vendor: "otel",
          service:
            process.env.PHOENIX_COLLECTOR_ENDPOINT ||
            process.env.DATADOG_OTLP_ENDPOINT ||
            "disabled",
          category: "observability",
          operation: "export-classification-run",
          purpose: "export run trace to OTEL collectors",
          status: exported ? "ok" : "skipped",
          durationMs: Date.now() - startedAt,
          input: { entryId: record.entryId },
          output: {
            promptVersion: record.promptVersion,
            exported,
          },
        });
        if (exported) {
          record.vendorTrace?.link({
            from: "classification-result",
            to: "otel",
            description: "final result is exported to OTEL collectors",
          });
          syncRecordVendorTrace(record);
        }
      } catch (error) {
        record.vendorTrace?.recordCall({
          vendor: "otel",
          service:
            process.env.PHOENIX_COLLECTOR_ENDPOINT ||
            process.env.DATADOG_OTLP_ENDPOINT ||
            "disabled",
          category: "observability",
          operation: "export-classification-run",
          purpose: "export run trace to OTEL collectors",
          status: "error",
          durationMs: Date.now() - startedAt,
          input: { entryId: record.entryId },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    })(),
  ]);

  const failures: string[] = [];
  if (CLASSIFIER_REQUIRE_LANGSMITH && results[0]?.status === "rejected") {
    failures.push(
      `langsmith: ${results[0].reason instanceof Error ? results[0].reason.message : String(results[0].reason)}`,
    );
  }
  if (CLASSIFIER_REQUIRE_OTEL && results[1]?.status === "rejected") {
    failures.push(
      `otel: ${results[1].reason instanceof Error ? results[1].reason.message : String(results[1].reason)}`,
    );
  }

  if (failures.length > 0) {
    throw new VendorDependencyError("observability", failures.join("; "));
  }
}

/**
 * Log a completed classification run.
 * Non-blocking: failures are silently ignored so classification is never gated on observability.
 */
export async function logRun(record: RunRecord): Promise<void> {
  // Always log to stdout in structured JSON (picked up by Vercel/Datadog/etc.)
  console.log(
    JSON.stringify({
      level: "info",
      event: "classification_run",
      entryId: record.entryId,
      title: record.title,
      durationMs: record.durationMs,
      overallConf: Math.round(record.overallConf * 100),
      needsReview: record.needsReview,
      model: record.model,
      promptVersion: record.promptVersion,
      warnings: record.consistencyWarnings?.length ?? 0,
    }),
  );

  try {
    const tasks: Promise<unknown>[] = [exportToVendors(record)];
    let persistIndex: number | null = null;
    if (hasPostgres) {
      persistIndex = tasks.length;
      tasks.push(persistRun(record));
    }
    const results = await Promise.allSettled(tasks);

    if (persistIndex !== null) {
      const persistResult = results[persistIndex];
      if (
        persistResult?.status === "fulfilled" &&
        typeof persistResult.value === "number"
      ) {
        await updatePersistedTrace(persistResult.value, record);
      }
    }

    if (CLASSIFIER_STRICT_VENDOR_MODE) {
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        throw new VendorDependencyError(
          "observability",
          rejected.reason instanceof Error
            ? rejected.reason.message
            : String(rejected.reason),
        );
      }
    }
  } catch (error) {
    if (CLASSIFIER_STRICT_VENDOR_MODE) throw error;
    /* non-fatal */
  }
}

/**
 * Retrieve recent runs for a dashboard or report.
 * Returns empty array if no DB.
 */
export async function getRecentRuns(options?: {
  limit?: number;
  needsReviewOnly?: boolean;
  since?: Date;
}): Promise<RunRecord[]> {
  if (!hasPostgres) return [];
  try {
    await ensureSchema();
    const conditions: string[] = [];
    const args: unknown[] = [];

    if (options?.needsReviewOnly) {
      conditions.push("needs_review = true");
    }
    if (options?.since) {
      args.push(options.since.toISOString());
      conditions.push(`classified_at > $${args.length}`);
    }

    const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
    args.push(options?.limit ?? 100);

    const result = await db.query(
      `select entry_id, title, url, content_type, duration_ms, overall_conf,
              needs_review, layer_decisions, field_values, consistency_warnings,
              model, has_correction
       from classification_runs
       ${where}
       order by classified_at desc
       limit $${args.length}`,
      args,
    );

    return result.rows.map((r: Record<string, unknown>) => ({
      entryId: r.entry_id as string,
      title: r.title as string | undefined,
      url: r.url as string | undefined,
      contentType: r.content_type as string | undefined,
      durationMs: r.duration_ms as number,
      overallConf: r.overall_conf as number,
      needsReview: r.needs_review as boolean,
      layerDecisions: r.layer_decisions as Record<string, string> | undefined,
      fieldValues: r.field_values as Record<string, { value: unknown; confidence: number }> | undefined,
      consistencyWarnings: r.consistency_warnings as string[] | undefined,
      model: r.model as string | undefined,
      hasCorrection: r.has_correction as boolean | undefined,
    })) as RunRecord[];
  } catch {
    return [];
  }
}

/**
 * Per-field accuracy summary from stored runs that have corrections.
 * Returns the data accuracy-report.ts computes manually, but from live DB.
 */
export async function getFieldAccuracySummary(): Promise<
  Array<{ field: string; exactMatch: number; avgConf: number; total: number }>
> {
  if (!hasPostgres) return [];
  try {
    await ensureSchema();
    // This query requires correction data to be stored in the run (has_correction=true)
    // For now return empty — full cross-join with corrections table is future work
    return [];
  } catch {
    return [];
  }
}
