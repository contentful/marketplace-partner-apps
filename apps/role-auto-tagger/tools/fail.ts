/** Shared top-level error handler: prints the CMA error body and the request ID Support needs. */
export function fail(error: unknown): never {
  const e = error as {
    details?: unknown;
    message?: unknown;
    request?: { requestId?: string };
    response?: { headers?: Record<string, string> };
  } | null;
  const requestId = e?.request?.requestId ?? e?.response?.headers?.['x-contentful-request-id'] ?? 'unknown';
  console.error(JSON.stringify(e?.details ?? e?.message ?? error, null, 2));
  console.error(`[request-id: ${requestId}]`);
  process.exit(1);
}
