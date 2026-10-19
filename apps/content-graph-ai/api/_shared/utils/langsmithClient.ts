import { Client as LangSmithClient } from "langsmith";
import { traceable, type TraceableConfig } from "langsmith/traceable";

let langsmithClient: LangSmithClient | null = null;

export function isLangSmithTracingEnabled(): boolean {
  return (
    Boolean(process.env.LANGSMITH_API_KEY) &&
    process.env.LANGSMITH_TRACING !== "false"
  );
}

export function getLangSmithProjectName(): string {
  return process.env.LANGSMITH_PROJECT || "content-graph";
}

export function getLangSmithClient(): LangSmithClient | null {
  if (!isLangSmithTracingEnabled()) {
    return null;
  }

  if (!langsmithClient) {
    langsmithClient = new LangSmithClient({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT,
      workspaceId: process.env.LANGSMITH_WORKSPACE_ID,
      timeout_ms: Number(process.env.LANGSMITH_TIMEOUT_MS || 30000),
      traceBatchConcurrency: Number(
        process.env.LANGSMITH_TRACE_BATCH_CONCURRENCY || 5,
      ),
    });
  }

  return langsmithClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeLangSmithTraceable<Func extends (...args: any[]) => any>(
  wrappedFunc: Func,
  config?: TraceableConfig<Func>,
) {
  const client = getLangSmithClient();
  return traceable(wrappedFunc, {
    ...config,
    client: client ?? undefined,
    project_name: config?.project_name || getLangSmithProjectName(),
    tracingEnabled: config?.tracingEnabled ?? isLangSmithTracingEnabled(),
  });
}
