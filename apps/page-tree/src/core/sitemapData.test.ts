import { describe, it, expect, vi } from "vitest";
import { loadSitemapItems } from "./sitemapData";
import type { SdkWithCma, TreeSourceConfig, CMAEntryLike } from "./types";

function makeEntry(args: {
  id: string;
  version?: number;
  publishedVersion?: number;
  fields: Record<string, unknown>;
}): CMAEntryLike {
  return {
    sys: {
      id: args.id,
      version: args.version,
      publishedVersion: args.publishedVersion,
    },
    fields: args.fields,
  };
}

describe("loadSitemapItems", () => {
  it("maps entries to TreeItems, computes state, skips missing paths, and dedupes duplicate paths", async () => {
    const sources: TreeSourceConfig[] = [
      {
        contentTypeId: "page",
        pathFieldId: "pagePath",
        titleFieldId: "title",
        routePrefix: "/news",
      },
      {
        contentTypeId: "article",
        pathFieldId: "slug",
        titleFieldId: "headline",
        routePrefix: "",
      },
    ];

    // Create entries. We intentionally include:
    // - a valid entry
    // - a duplicate path (same resolved path)
    // - an entry missing path -> should be skipped
    // - an "absolute path" that starts with "/" (routePrefix should effectively be irrelevant depending on buildPath logic)
    const pageEntries: CMAEntryLike[] = [
      makeEntry({
        id: "p1",
        version: 1,
        // unpublished -> draft
        publishedVersion: undefined,
        fields: {
          pagePath: "foo",
          title: "Foo Page",
        },
      }),
      makeEntry({
        id: "p2",
        version: 5,
        publishedVersion: 3, // version >= publishedVersion + 2 => changed
        fields: {
          pagePath: "foo", // duplicate of p1 when combined with routePrefix
          title: "Foo Page Duplicate",
        },
      }),
      makeEntry({
        id: "p3",
        version: 4,
        publishedVersion: 3, // published (not changed): 4 >= 5? false
        fields: {
          // missing pagePath -> skip
          title: "No Path",
        },
      }),
    ];

    const articleEntries: CMAEntryLike[] = [
      makeEntry({
        id: "a1",
        version: 4,
        publishedVersion: 3, // published
        fields: {
          slug: "/absolute",
          headline: { "en-US": "Absolute Title" },
        },
      }),
      makeEntry({
        id: "a2",
        version: 6,
        publishedVersion: 3, // changed
        fields: {
          slug: "bar",
          headline: "Bar Title",
        },
      }),
    ];

    const getMany = vi.fn(
      async ({ query }: { query: { content_type: string } }) => {
        if (query.content_type === "page") return { items: pageEntries };
        if (query.content_type === "article") return { items: articleEntries };
        return { items: [] };
      },
    );

    const sdk: SdkWithCma = {
      cma: {
        entry: { getMany },
      },
    };

    const res = await loadSitemapItems({
      sdk,
      sources,
      locale: "en-US",
    });

    // It should call CMA once per source
    expect(getMany).toHaveBeenCalledTimes(2);

    // Items should NOT include p3 (missing path)…
    const ids = res.items.map((i) => i.entryId);
    expect(ids).not.toContain("p3");

    // …but p3 should be surfaced as a missing-path entry (orphan)
    expect(res.missingPaths.length).toBe(1);
    expect(res.missingPaths[0].entryId).toBe("p3");
    expect(res.missingPaths[0].contentTypeId).toBe("page");
    expect(res.missingPaths[0].title).toBe("No Path");
    expect(res.missingPaths[0].state).toBe("published");

    // Should include article items and 1 "winner" for the duplicate /news/foo
    // winner is first fetched (p1) due to pickWinnerByCreatedAt
    expect(ids).toContain("p1");
    expect(ids).not.toContain("p2"); // p2 is the "loser" in dedupe

    // Validate mapping for p1
    const p1 = res.items.find((i) => i.entryId === "p1");
    expect(p1).toBeTruthy();
    expect(p1?.contentTypeId).toBe("page");
    expect(p1?.path).toBe("/news/foo");
    expect(p1?.title).toBe("Foo Page");
    expect(p1?.state).toBe("draft");

    // Validate mapping for a2
    const a2 = res.items.find((i) => i.entryId === "a2");
    expect(a2).toBeTruthy();
    expect(a2?.contentTypeId).toBe("article");
    expect(a2?.path).toBe("/bar");
    expect(a2?.title).toBe("Bar Title");
    expect(a2?.state).toBe("changed");

    // Absolute slug should remain absolute (and still be included)
    const a1 = res.items.find((i) => i.entryId === "a1");
    expect(a1).toBeTruthy();
    expect(a1?.path).toBe("/absolute");
    expect(a1?.title).toBe("Absolute Title");
    expect(a1?.state).toBe("published");

    // Duplicates should report the duplicate path with stable sorted entry ordering
    expect(res.duplicates.length).toBe(1);
    expect(res.duplicates[0].path).toBe("/news/foo");
    expect(res.duplicates[0].entries.map((e) => e.entryId)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("returns empty arrays when sources is empty", async () => {
    const sdk: SdkWithCma = {
      cma: {
        entry: {
          getMany: vi.fn(async () => ({ items: [] })),
        },
      },
    };

    const res = await loadSitemapItems({
      sdk,
      sources: [],
      locale: "en-US",
    });

    expect(res).toEqual({ items: [], duplicates: [], missingPaths: [] });
  });
});
