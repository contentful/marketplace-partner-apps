import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEventSource } from "./fetchEventSource";

function sseResponse(chunks: string[], init: ResponseInit = {}): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

function stubFetch(response: Response) {
  const spy = vi.fn().mockResolvedValue(response);
  // Replace the global fetch for the duration of a test.
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("fetchEventSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses a single event and invokes onMessage with the data payload", async () => {
    stubFetch(sseResponse(["data: hello\n\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith("hello");
  });

  it("joins multi-line data fields with a newline", async () => {
    stubFetch(sseResponse(["data: line1\ndata: line2\n\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenCalledWith("line1\nline2");
  });

  it("delivers multiple events when separated by blank lines", async () => {
    stubFetch(sseResponse(["data: one\n\ndata: two\n\ndata: three\n\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenCalledTimes(3);
    expect(onMessage).toHaveBeenNthCalledWith(1, "one");
    expect(onMessage).toHaveBeenNthCalledWith(2, "two");
    expect(onMessage).toHaveBeenNthCalledWith(3, "three");
  });

  it("normalizes CRLF line endings", async () => {
    stubFetch(sseResponse(["data: one\r\n\r\ndata: two\r\n\r\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenNthCalledWith(1, "one");
    expect(onMessage).toHaveBeenNthCalledWith(2, "two");
  });

  it("ignores comment lines (prefixed with `:`)", async () => {
    stubFetch(sseResponse([": heartbeat\ndata: payload\n\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith("payload");
  });

  it("strips the optional single leading space after the colon", async () => {
    stubFetch(sseResponse(["data:no-space\n\n"]));
    const onMessage = vi.fn();
    await fetchEventSource({ url: "https://example.test/stream", onMessage });
    expect(onMessage).toHaveBeenCalledWith("no-space");
  });

  it("throws a rich error when the response is not ok, including statusText and body", async () => {
    stubFetch(
      new Response("Unauthorized token", {
        status: 401,
        statusText: "Unauthorized",
      }),
    );
    const onMessage = vi.fn();
    await expect(
      fetchEventSource({ url: "https://example.test/stream", onMessage }),
    ).rejects.toThrow(/401 Unauthorized: Unauthorized token/);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("forwards a provided AbortSignal to fetch", async () => {
    const spy = stubFetch(sseResponse([]));
    const controller = new AbortController();
    const onMessage = vi.fn();
    await fetchEventSource({
      url: "https://example.test/stream",
      onMessage,
      signal: controller.signal,
      headers: { Authorization: "Bearer tok" },
    });
    expect(spy).toHaveBeenCalledWith(
      "https://example.test/stream",
      expect.objectContaining({
        signal: controller.signal,
        headers: { Authorization: "Bearer tok" },
      }),
    );
  });

  it("routes onMessage errors through the provided onError instead of crashing the stream", async () => {
    stubFetch(sseResponse(["data: first\n\ndata: second\n\n"]));
    const onError = vi.fn();
    const onMessage = vi.fn().mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await fetchEventSource({
      url: "https://example.test/stream",
      onMessage,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onMessage).toHaveBeenCalledTimes(2);
  });
});
