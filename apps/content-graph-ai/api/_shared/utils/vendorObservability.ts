import { trace, SpanStatusCode } from "@opentelemetry/api";
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import type { RunRecord } from "./observability.js";
import { CLASSIFIER_REQUIRE_OTEL } from "../config/classifierPipeline.js";
import { VendorDependencyError } from "./classifierErrors.js";
import { getLangSmithClient } from "./langsmithClient.js";

let providerInitialized = false;
let tracerProvider: NodeTracerProvider | null = null;

function initOtelProvider() {
  if (providerInitialized) return;

  const exporters: OTLPTraceExporter[] = [];
  const phoenixEndpoint = process.env.PHOENIX_COLLECTOR_ENDPOINT;
  const datadogEndpoint = process.env.DATADOG_OTLP_ENDPOINT;

  if (phoenixEndpoint) {
    exporters.push(new OTLPTraceExporter({ url: phoenixEndpoint }));
  }
  if (datadogEndpoint) {
    exporters.push(
      new OTLPTraceExporter({
        url: datadogEndpoint,
        headers: process.env.DD_API_KEY
          ? { "DD-API-KEY": process.env.DD_API_KEY }
          : undefined,
      }),
    );
  }

  if (exporters.length === 0) {
    if (CLASSIFIER_REQUIRE_OTEL) {
      throw new VendorDependencyError(
        "otel",
        "PHOENIX_COLLECTOR_ENDPOINT or DATADOG_OTLP_ENDPOINT is required",
      );
    }
    providerInitialized = true;
    return;
  }

  tracerProvider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: "content-graph-classifier",
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    }),
    spanProcessors: exporters.map(
      (exporter) => new BatchSpanProcessor(exporter),
    ),
  });
  tracerProvider.register();
  providerInitialized = true;
}

export async function exportRunToLangSmith(
  _record: RunRecord,
): Promise<boolean> {
  const client = getLangSmithClient();
  if (!client) return false;

  try {
    await client.flush();
    await client.awaitPendingTraceBatches();
    return true;
  } catch (error) {
    throw new VendorDependencyError(
      "langsmith",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function exportRunToOtel(record: RunRecord): Promise<boolean> {
  initOtelProvider();
  if (!tracerProvider) return false;
  const tracer = trace.getTracer("content-graph-classifier");
  const span = tracer.startSpan("content.classification.run", {
    attributes: {
      "content.entry_id": record.entryId,
      "content.type": record.contentType || "",
      "content.needs_review": record.needsReview,
      "content.overall_conf": record.overallConf,
      "llm.model": record.model || "",
      "classifier.prompt_version": record.promptVersion || "",
    },
  });

  try {
    span.setAttribute(
      "classifier.review_reasons",
      JSON.stringify(record.reviewRouting || {}),
    );
    span.setAttribute(
      "classifier.stage_timings",
      JSON.stringify(record.stageTimings || {}),
    );
    span.setAttribute(
      "classifier.token_usage",
      JSON.stringify(record.tokenUsage || {}),
    );
    span.setAttribute(
      "classifier.vendor_trace_calls",
      JSON.stringify(record.trace?.vendorCalls || []),
    );
    span.setAttribute(
      "classifier.vendor_trace_wiring",
      JSON.stringify(record.trace?.wiring || []),
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return true;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new VendorDependencyError(
      "otel",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    span.end();
    if (tracerProvider) {
      await tracerProvider.forceFlush();
    }
  }
}
