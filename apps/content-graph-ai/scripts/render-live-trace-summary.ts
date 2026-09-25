#!/usr/bin/env tsx

import * as fs from "node:fs";
import * as path from "node:path";

type TraceValue =
  | {
      value?: unknown;
      confidence?: number;
    }
  | null
  | undefined;

type VendorCall = {
  vendor?: string;
  operation?: string;
  status?: string;
  durationMs?: number;
  service?: string;
};

type TraceDocument = {
  capturedAt?: string;
  entryId?: string;
  routeTrace?: Array<{
    step?: string;
    output?: Record<string, unknown>;
  }>;
  vendorTrace?: {
    vendors?: string[];
    calls?: VendorCall[];
    wiring?: Array<{
      from?: string;
      to?: string;
      description?: string;
    }>;
  };
  result?: Record<string, unknown> & {
    overallConfidence?: number;
    needsReview?: boolean;
    reviewReasons?: string[];
  };
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "none";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "none";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatTraceValue(value: TraceValue): string {
  if (!value) return "none";
  return formatScalar((value as { value?: unknown }).value);
}

function formatConfidence(value: TraceValue): string | null {
  if (!value || typeof value !== "object" || value.confidence === undefined) {
    return null;
  }
  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence)) return null;
  return `${Math.round(confidence * 100)}%`;
}

function findVendorCall(
  vendorCalls: VendorCall[],
  vendor: string,
  operation: string,
): VendorCall | undefined {
  return vendorCalls.find(
    (call) => call.vendor === vendor && call.operation === operation,
  );
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith("--")) {
    throw new Error(
      "Usage: tsx scripts/render-live-trace-summary.ts <trace.json> [--out path]",
    );
  }

  const outputPath =
    getArgValue("--out") ||
    inputPath.replace(/\.json$/i, ".md") ||
    `${inputPath}.md`;

  const trace = readJson<TraceDocument>(inputPath);
  const result = trace.result || {};
  const vendorCalls = trace.vendorTrace?.calls || [];
  const wiring = trace.vendorTrace?.wiring || [];
  const routeTrace = trace.routeTrace || [];
  const routeDeepCrawl = routeTrace.find((step) => step.step === "deep-crawl");
  const crawlOutput = routeDeepCrawl?.output || {};

  const keyFields: Array<[string, TraceValue]> = [
    ["assetSubType", result.assetSubType as TraceValue],
    ["product", result.product as TraceValue],
    ["topic", result.topic as TraceValue],
    ["useCases", result.useCases as TraceValue],
    ["industry", result.industry as TraceValue],
    ["funnelStage", result.funnelStage as TraceValue],
    ["jobFunction", result.jobFunction as TraceValue],
    ["jobLevel", result.jobLevel as TraceValue],
    ["audience", result.audience as TraceValue],
    ["language", result.language as TraceValue],
  ];

  const timingRows: Array<[string, VendorCall | undefined]> = [
    [
      "Deep crawl",
      findVendorCall(vendorCalls, "contentful-cda", "deep-crawl-entry") ||
        findVendorCall(
          vendorCalls,
          "contentful-management",
          "deep-crawl-entry-fallback",
        ),
    ],
    [
      "NLP enrichment",
      findVendorCall(vendorCalls, "nlp-sidecar", "enrich-content-signals"),
    ],
    [
      "Few-shot embeddings",
      findVendorCall(vendorCalls, "google-ai-studio", "embed-few-shot-query"),
    ],
    [
      "Few-shot retrieval",
      findVendorCall(vendorCalls, "chroma", "query-few-shot-corrections"),
    ],
    [
      "Fact stage",
      findVendorCall(vendorCalls, "gemini", "fact-stage-classification"),
    ],
    [
      "Subjective stage",
      findVendorCall(vendorCalls, "gemini", "subjective-stage-classification"),
    ],
    [
      "OTEL export",
      findVendorCall(vendorCalls, "otel", "export-classification-run"),
    ],
    [
      "LangSmith flush",
      findVendorCall(vendorCalls, "langsmith", "flush-pending-traces"),
    ],
  ];

  const lines: string[] = [];
  lines.push("# Live Classify Trace");
  lines.push("");
  lines.push(`- Captured at: \`${trace.capturedAt || "unknown"}\``);
  lines.push(`- Entry ID: \`${trace.entryId || "unknown"}\``);
  lines.push(
    `- Overall confidence: \`${typeof result.overallConfidence === "number" ? result.overallConfidence.toFixed(2) : "unknown"}\``,
  );
  lines.push(`- Needs review: \`${String(result.needsReview ?? "unknown")}\``);
  lines.push("");

  lines.push("## Final Fields");
  lines.push("");
  for (const [field, value] of keyFields) {
    const confidence = formatConfidence(value);
    const suffix = confidence ? ` (${confidence})` : "";
    lines.push(`- \`${field}\`: ${formatTraceValue(value)}${suffix}`);
  }
  lines.push("");

  lines.push("## Crawl Snapshot");
  lines.push("");
  lines.push(`- Title: ${formatScalar(crawlOutput.title)}`);
  lines.push(`- Slug: ${formatScalar(crawlOutput.slug)}`);
  lines.push(`- Content type: ${formatScalar(crawlOutput.finalContentType)}`);
  lines.push(`- Crawl source: ${formatScalar(crawlOutput.crawlSource)}`);
  lines.push(`- Text length: ${formatScalar(crawlOutput.textLength)}`);
  lines.push("");

  lines.push("## Stage Timings");
  lines.push("");
  for (const [label, call] of timingRows) {
    if (!call) continue;
    lines.push(
      `- ${label}: \`${call.durationMs ?? "unknown"}ms\` (${call.vendor}/${call.operation}, status=${call.status || "unknown"})`,
    );
  }
  lines.push("");

  lines.push("## Vendors");
  lines.push("");
  for (const vendor of trace.vendorTrace?.vendors || []) {
    lines.push(`- \`${vendor}\``);
  }
  lines.push("");

  lines.push("## Wiring");
  lines.push("");
  for (const edge of wiring) {
    lines.push(
      `- \`${edge.from || "unknown"} -> ${edge.to || "unknown"}\`: ${edge.description || "no description"}`,
    );
  }

  const reviewReasons = Array.isArray(result.reviewReasons)
    ? result.reviewReasons
    : [];
  if (reviewReasons.length > 0) {
    lines.push("");
    lines.push("## Review Reasons");
    lines.push("");
    for (const reason of reviewReasons) {
      lines.push(`- ${reason}`);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, inputPath, outputPath }, null, 2));
}

main();
