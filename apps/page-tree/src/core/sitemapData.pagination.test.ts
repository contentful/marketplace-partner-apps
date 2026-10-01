import { describe, it, expect, vi } from "vitest";
import { loadSitemapItems } from "./sitemapData";
import { findOrphanItems } from "./orphans";
import type { SdkWithCma, TreeSourceConfig, CMAEntryLike } from "./types";

function makeEntry(id: string, slug: string, title = id): CMAEntryLike {
  return {
    sys: { id, version: 4, publishedVersion: 3 },
    fields: { slug, title },
  };
}

const source: TreeSourceConfig = {
  contentTypeId: "page",
  pathFieldId: "slug",
  titleFieldId: "title",
};

describe("loadSitemapItems — CMA pagination", () => {
  it("fetches all pages when a content type has more than 1000 entries", async () => {
    // First batch: exactly 1000 entries; second batch: 500.
    const batch1: CMAEntryLike[] = Array.from({ length: 1000 }, (_, i) =>
      makeEntry(`e${i}`, `page-${i}`),
    );
    const batch2: CMAEntryLike[] = Array.from({ length: 500 }, (_, i) =>
      makeEntry(`e${1000 + i}`, `page-${1000 + i}`),
    );

    const getMany = vi.fn(
      async ({ query }: { query: { skip: number; limit: number } }) => {
        if (query.skip === 0) return { items: batch1 };
        if (query.skip === 1000) return { items: batch2 };
        return { items: [] };
      },
    );

    const sdk: SdkWithCma = { cma: { entry: { getMany } } };

    const res = await loadSitemapItems({
      sdk,
      sources: [source],
      locale: "en-US",
    });

    expect(getMany).toHaveBeenCalledTimes(2);
    expect(getMany.mock.calls[0][0].query.skip).toBe(0);
    expect(getMany.mock.calls[1][0].query.skip).toBe(1000);
    expect(res.items.length).toBe(1500);
  });

  it("stops after a single call when the batch is not full", async () => {
    const getMany = vi.fn(async () => ({
      items: [makeEntry("e1", "a"), makeEntry("e2", "b")],
    }));

    const sdk: SdkWithCma = { cma: { entry: { getMany } } };

    const res = await loadSitemapItems({
      sdk,
      sources: [source],
      locale: "en-US",
    });

    expect(getMany).toHaveBeenCalledTimes(1);
    expect(res.items.length).toBe(2);
  });
});

describe("loadSitemapItems — feature interactions", () => {
  it("an entry can be both a duplicate loser and leave an orphan behind", async () => {
    // /a exists; /a/b/c is claimed by two entries (e2 wins, e3 reported as
    // duplicate); the surviving /a/b/c is a ghost-parent orphan (/a/b missing).
    const getMany = vi.fn(async () => ({
      items: [
        makeEntry("e1", "/a", "A"),
        makeEntry("e2", "/a/b/c", "C first"),
        makeEntry("e3", "/a/b/c", "C second"),
      ],
    }));

    const sdk: SdkWithCma = { cma: { entry: { getMany } } };

    const res = await loadSitemapItems({
      sdk,
      sources: [source],
      locale: "en-US",
    });

    // Dedupe: first-fetched entry wins
    expect(res.items.map((i) => i.entryId).sort()).toEqual(["e1", "e2"]);
    expect(res.duplicates.length).toBe(1);
    expect(res.duplicates[0].path).toBe("/a/b/c");

    // The winner is still structurally orphaned
    const orphans = findOrphanItems(res.items);
    expect(orphans.map((o) => o.entryId)).toEqual(["e2"]);
  });

  it("treats paths as case-sensitive: /About and /about are distinct, not duplicates", async () => {
    const getMany = vi.fn(async () => ({
      items: [makeEntry("e1", "/About"), makeEntry("e2", "/about")],
    }));

    const sdk: SdkWithCma = { cma: { entry: { getMany } } };

    const res = await loadSitemapItems({
      sdk,
      sources: [source],
      locale: "en-US",
    });

    expect(res.items.length).toBe(2);
    expect(res.duplicates.length).toBe(0);
  });

  it("falls back to the first available locale string for localized fields", async () => {
    const entry: CMAEntryLike = {
      sys: { id: "e1", version: 4, publishedVersion: 3 },
      fields: {
        slug: { "de-DE": "hallo" }, // configured locale (en-US) missing
        title: { "de-DE": "Hallo Seite" },
      },
    };

    const getMany = vi.fn(async () => ({ items: [entry] }));
    const sdk: SdkWithCma = { cma: { entry: { getMany } } };

    const res = await loadSitemapItems({
      sdk,
      sources: [source],
      locale: "en-US",
    });

    expect(res.items.length).toBe(1);
    expect(res.items[0].path).toBe("/hallo");
    expect(res.items[0].title).toBe("Hallo Seite");
  });
});
