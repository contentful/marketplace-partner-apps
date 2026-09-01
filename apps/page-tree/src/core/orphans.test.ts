import { describe, it, expect } from "vitest";
import { computeOrphanPaths, findOrphanItems, parentPathOf } from "./orphans";
import type { TreeItem } from "./types";

function item(path: string, entryId = path): TreeItem {
  return {
    entryId,
    contentTypeId: "page",
    path,
    state: "published",
  };
}

describe("parentPathOf", () => {
  it("returns '/' for top-level paths", () => {
    expect(parentPathOf("/about")).toBe("/");
  });

  it("returns the direct parent for nested paths", () => {
    expect(parentPathOf("/a/b/c")).toBe("/a/b");
  });

  it("returns '' for root or empty", () => {
    expect(parentPathOf("/")).toBe("");
    expect(parentPathOf("")).toBe("");
  });
});

describe("computeOrphanPaths", () => {
  it("flags pages whose direct parent has no entry", () => {
    const items = [item("/a"), item("/a/b/c")]; // /a/b has no entry
    const orphans = computeOrphanPaths(items);
    expect(orphans.has("/a/b/c")).toBe(true);
    expect(orphans.has("/a")).toBe(false);
  });

  it("does not flag pages whose parent exists", () => {
    const items = [item("/a"), item("/a/b"), item("/a/b/c")];
    expect(computeOrphanPaths(items).size).toBe(0);
  });

  it("never flags top-level pages", () => {
    const items = [item("/standalone")];
    expect(computeOrphanPaths(items).size).toBe(0);
  });

  it("flags each level independently (missing grandparent chain)", () => {
    // /x has no entry: /x/y is orphan; /x/y exists as entry? no.
    // /x/y/z's parent /x/y also has no entry -> orphan too.
    const items = [item("/x/y/z"), item("/x/y")];
    const orphans = computeOrphanPaths(items);
    expect(orphans.has("/x/y")).toBe(true); // parent /x missing
    expect(orphans.has("/x/y/z")).toBe(false); // parent /x/y exists
  });
});

describe("findOrphanItems", () => {
  it("returns orphan items sorted by path", () => {
    const items = [item("/z/deep/page"), item("/a/deep/page"), item("/a")];
    const orphans = findOrphanItems(items);
    expect(orphans.map((o) => o.path)).toEqual([
      "/a/deep/page",
      "/z/deep/page",
    ]);
  });

  it("returns empty array when there are no orphans", () => {
    const items = [item("/a"), item("/a/b")];
    expect(findOrphanItems(items)).toEqual([]);
  });
});
