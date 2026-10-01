// One readable line from a CMA failure. The browser CMA client rejects with a PLAIN OBJECT, not an
// Error, and often JSON-encodes the real error inside `message` — so `String(err)` gives
// "[object Object]" and `err.message` gives a wall of JSON that includes request headers. This pulls
// out only what a person can act on: status, Contentful's reasons, and the request ID Support needs.

interface RawCmaError {
  message?: unknown;
  status?: unknown;
  statusText?: unknown;
  details?: { reasons?: unknown; errors?: unknown } | string;
  requestId?: unknown;
  request?: { requestId?: unknown };
}

function asRaw(error: unknown): RawCmaError {
  const raw = (error && typeof error === 'object' ? error : {}) as RawCmaError;
  if (typeof raw.message === 'string' && raw.message.trimStart().startsWith('{')) {
    try {
      return { ...raw, ...(JSON.parse(raw.message) as RawCmaError) };
    } catch {
      // Not JSON after all; the outer fields are all there is.
    }
  }
  return raw;
}

function reasonsOf(details: RawCmaError['details']): string[] {
  if (!details) return [];
  if (typeof details === 'string') return [details];
  const reasons: string[] = [];
  if (Array.isArray(details.reasons)) {
    for (const r of details.reasons) if (typeof r === 'string') reasons.push(r);
  }
  if (Array.isArray(details.errors)) {
    for (const e of details.errors as Array<{ name?: string; details?: string; path?: unknown }>) {
      const path = Array.isArray(e?.path) ? ` (${e.path.join('.')})` : '';
      const text = e?.details ?? e?.name;
      if (text) reasons.push(`${text}${path}`);
    }
  }
  return reasons;
}

export function describeError(error: unknown): string {
  if (typeof error === 'string' && error) return error;
  const raw = asRaw(error);

  const parts: string[] = [];
  const status = typeof raw.status === 'number' ? raw.status : undefined;
  const statusText = typeof raw.statusText === 'string' ? raw.statusText : undefined;
  if (status !== undefined) parts.push(statusText ? `${status} ${statusText}` : String(status));

  const reasons = reasonsOf(raw.details);
  if (reasons.length > 0) {
    parts.push(reasons.join('; '));
  } else if (typeof raw.message === 'string' && raw.message && !raw.message.trimStart().startsWith('{')) {
    parts.push(raw.message);
  }

  const text = parts.join(': ') || 'Unknown error, with no detail from Contentful';
  const requestId = raw.requestId ?? raw.request?.requestId;
  return typeof requestId === 'string' && requestId ? `${text} [request-id: ${requestId}]` : text;
}
