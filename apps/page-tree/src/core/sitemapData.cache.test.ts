import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadSitemapItems, clearSitemapCache } from "./sitemapData";
import type { SdkWithCma, TreeSourceConfig } from "./types";

const source: TreeSourceConfig = {
  contentTypeId: "page",
  pathFieldId: "slug",
};

function makeSdk(getMany: ReturnType<typeof vi.fn>): SdkWithCma {
  return { cma: { entry: { getMany } } };
}

const BASE_ARGS = {
  sources: [source],
  locale: "en-US",
  spaceId: "sp1",
  environmentId: "master",
};

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

describe("loadSitemapItems — in-memory cache", () => {
  beforeEach(() => clearSitemapCache());

  it("returns cached result on second call within TTL (no additional CMA call)", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });

    await loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS });
    await loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS });

    expect(getMany).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache for a different spaceId", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const sdk = makeSdk(getMany);

    await loadSitemapItems({ sdk, ...BASE_ARGS, spaceId: "sp1" });
    await loadSitemapItems({ sdk, ...BASE_ARGS, spaceId: "sp2" });

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it("bypasses cache for a different environmentId (no cross-env collision)", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const sdk = makeSdk(getMany);

    await loadSitemapItems({ sdk, ...BASE_ARGS, environmentId: "master" });
    await loadSitemapItems({ sdk, ...BASE_ARGS, environmentId: "staging" });

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it("skips caching when environmentId is omitted (space alone is not enough)", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const sdk = makeSdk(getMany);
    const args = { sdk, sources: [source], locale: "en-US", spaceId: "sp1" };

    await loadSitemapItems(args);
    await loadSitemapItems(args);

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it("bypasses cache for a different locale", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const sdk = makeSdk(getMany);

    await loadSitemapItems({ sdk, ...BASE_ARGS, locale: "en-US" });
    await loadSitemapItems({ sdk, ...BASE_ARGS, locale: "de-DE" });

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it("skips caching when spaceId is omitted (no interference with unit tests)", async () => {
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const sdk = makeSdk(getMany);
    const args = { sdk, sources: [source], locale: "en-US" };

    await loadSitemapItems(args);
    await loadSitemapItems(args);

    // Both calls must go through — no cache when spaceId is absent
    expect(getMany).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// 429 retry with exponential back-off
// ---------------------------------------------------------------------------

describe("loadSitemapItems — 429 retry", () => {
  beforeEach(() => {
    clearSitemapCache();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("retries on 429 via .status and succeeds on second attempt", async () => {
    let calls = 0;
    const getMany = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) throw Object.assign(new Error("rate limited"), { status: 429 });
      return { items: [] };
    });

    const resultPromise = loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(getMany).toHaveBeenCalledTimes(2);
    expect(result.items).toEqual([]);
  });

  it("retries on 429 detected via response.status", async () => {
    let calls = 0;
    const getMany = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1)
        throw Object.assign(new Error("rate limited"), { response: { status: 429 } });
      return { items: [] };
    });

    const resultPromise = loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS });
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it("propagates error after all retries exhausted on persistent 429", async () => {
    const err = Object.assign(new Error("rate limited"), { status: 429 });
    const getMany = vi.fn().mockRejectedValue(err);

    const resultPromise = loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS });
    // Attach rejection handler immediately to prevent an unhandled-rejection
    // warning while we advance the retry timers.
    const caught = resultPromise.catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const rejection = await caught;
    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toBe("rate limited");
    // initial + 2 retries = 3 total calls
    expect(getMany).toHaveBeenCalledTimes(3);
  });

  it("does not retry on non-429 errors", async () => {
    const getMany = vi.fn().mockRejectedValue(new Error("not found"));

    // Inline expect avoids a dangling rejected promise while timers are fake
    await expect(
      loadSitemapItems({ sdk: makeSdk(getMany), ...BASE_ARGS }),
    ).rejects.toThrow("not found");

    expect(getMany).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Concurrency: sources processed sequentially
// ---------------------------------------------------------------------------

describe("loadSitemapItems — sequential source processing", () => {
  beforeEach(() => clearSitemapCache());

  it("processes two sources one after the other (no concurrent CMA calls)", async () => {
    const callOrder: string[] = [];
    const getMany = vi.fn().mockImplementation(
      async ({ query }: { query: { content_type: string } }) => {
        callOrder.push(query.content_type);
        return { items: [] };
      },
    );

    await loadSitemapItems({
      sdk: makeSdk(getMany),
      sources: [
        { contentTypeId: "page", pathFieldId: "slug" },
        { contentTypeId: "article", pathFieldId: "slug" },
      ],
      locale: "en-US",
      spaceId: "sp1",
      environmentId: "master",
    });

    // Sequential: page is always fetched before article
    expect(callOrder).toEqual(["page", "article"]);
  });
});
