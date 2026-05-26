/**
 * Authenticated EventSource using fetch + ReadableStream.
 * Unlike the native EventSource API, this supports custom headers
 * (e.g. Authorization: Bearer).
 *
 * Handles CRLF newlines and multi-line `data:` fields per the SSE spec.
 */

export interface FetchEventSourceOptions {
  url: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onMessage: (data: string) => void | Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Open an SSE stream via fetch and invoke `onMessage` for each event.
 * Resolves when the stream ends or is aborted.
 */
export async function fetchEventSource({
  url,
  headers,
  signal,
  onMessage,
  onError = (err) => {
    throw err;
  },
}: FetchEventSourceOptions): Promise<void> {
  const response = await fetch(url, { headers, signal });

  if (!response.ok || !response.body) {
    // Include statusText and a short body snippet when available so auth/proxy
    // failures are actionable instead of surfacing just a numeric code.
    let bodySnippet = "";
    try {
      const text = await response.text();
      bodySnippet = text ? `: ${text.slice(0, 200)}` : "";
    } catch {
      // ignore — body may have been consumed or be unreadable
    }
    throw new Error(
      `Stream error: ${String(response.status)} ${response.statusText}${bodySnippet}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  async function processEventChunk(chunk: string): Promise<void> {
    const lines = chunk.split("\n");
    const dataLines: string[] = [];

    for (const line of lines) {
      if (!line || line.startsWith(":")) continue;

      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const field = line.slice(0, colonIndex);
      let value = line.slice(colonIndex + 1);
      if (value.startsWith(" ")) {
        value = value.slice(1);
      }

      if (field === "data") {
        dataLines.push(value);
      }
    }

    if (!dataLines.length) return;

    const data = dataLines.join("\n");
    try {
      await onMessage(data);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function processBuffer(isFinal = false): Promise<void> {
    if (!buffer) return;

    buffer = buffer.replaceAll("\r\n", "\n");

    for (;;) {
      const delimiterIndex = buffer.indexOf("\n\n");
      if (delimiterIndex === -1) {
        if (isFinal && buffer.trim().length > 0) {
          const remaining = buffer;
          buffer = "";
          await processEventChunk(remaining);
        }
        break;
      }

      const eventChunk = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);

      if (!eventChunk.trim()) continue;

      await processEventChunk(eventChunk);
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        await processBuffer(true);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      await processBuffer(false);
    }
  } finally {
    reader.releaseLock();
  }
}
