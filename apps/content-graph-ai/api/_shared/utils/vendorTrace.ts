export type VendorTraceStatus = "ok" | "error" | "skipped";

export interface VendorTraceCall {
  id: string;
  at: string;
  vendor: string;
  service?: string;
  category: string;
  operation: string;
  purpose?: string;
  status: VendorTraceStatus;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface VendorTraceEdge {
  from: string;
  to: string;
  description: string;
}

export interface VendorTraceSnapshot {
  vendors: string[];
  calls: VendorTraceCall[];
  wiring: VendorTraceEdge[];
}

export interface VendorTraceCollector {
  recordCall(call: Omit<VendorTraceCall, "id" | "at">): VendorTraceCall;
  link(edge: VendorTraceEdge): void;
  trace<T>(
    params: Omit<VendorTraceCall, "id" | "at" | "status" | "durationMs"> & {
      mapResult?: (result: T) => Record<string, unknown> | undefined;
    },
    task: () => Promise<T>,
  ): Promise<T>;
  snapshot(): VendorTraceSnapshot;
}

function cleanObject(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const entries = Object.entries(value).filter(
    ([, next]) => next !== undefined,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function truncateTraceText(
  input: string | undefined,
  limit = 240,
): string {
  const value = String(input || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return "";
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

export function createVendorTraceCollector(
  initialWiring: VendorTraceEdge[] = [],
): VendorTraceCollector {
  let counter = 0;
  const calls: VendorTraceCall[] = [];
  const wiring: VendorTraceEdge[] = [];
  const wiringKeys = new Set<string>();

  const link = (edge: VendorTraceEdge) => {
    const key = `${edge.from}=>${edge.to}=>${edge.description}`;
    if (wiringKeys.has(key)) return;
    wiringKeys.add(key);
    wiring.push(edge);
  };

  initialWiring.forEach(link);

  return {
    recordCall(call) {
      counter += 1;
      const event: VendorTraceCall = {
        id: `vendor-call-${counter}`,
        at: new Date().toISOString(),
        vendor: call.vendor,
        service: call.service,
        category: call.category,
        operation: call.operation,
        purpose: call.purpose,
        status: call.status,
        durationMs: call.durationMs,
        input: cleanObject(call.input),
        output: cleanObject(call.output),
        error: call.error,
      };
      calls.push(event);
      return event;
    },
    link,
    async trace(params, task) {
      const startedAt = Date.now();
      try {
        const result = await task();
        this.recordCall({
          vendor: params.vendor,
          service: params.service,
          category: params.category,
          operation: params.operation,
          purpose: params.purpose,
          status: "ok",
          durationMs: Date.now() - startedAt,
          input: params.input,
          output: params.mapResult?.(result),
        });
        return result;
      } catch (error) {
        this.recordCall({
          vendor: params.vendor,
          service: params.service,
          category: params.category,
          operation: params.operation,
          purpose: params.purpose,
          status: "error",
          durationMs: Date.now() - startedAt,
          input: params.input,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    snapshot() {
      return {
        vendors: Array.from(new Set(calls.map((call) => call.vendor))).sort(),
        calls: [...calls],
        wiring: [...wiring],
      };
    },
  };
}
