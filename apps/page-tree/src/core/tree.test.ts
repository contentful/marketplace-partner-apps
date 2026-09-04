import { describe, expect, it } from "vitest";
import { buildTreeFromItems, filterTreeByQuery } from "./tree";
import type { TreeItem } from "./types";

describe("buildTreeFromItems", () => {
  it("builds hierarchical nodes from absolute paths", () => {
    // Arrange
    const items: TreeItem[] = [
      {
        entryId: "1",
        contentTypeId: "page",
        path: "/news",
        state: "published",
      },
      {
        entryId: "2",
        contentTypeId: "page",
        path: "/news/a",
        state: "published",
      },
      {
        entryId: "3",
        contentTypeId: "page",
        path: "/news/a/b",
        state: "published",
      },
      {
        entryId: "4",
        contentTypeId: "page",
        path: "/about",
        state: "published",
      },
    ];

    // Act
    const roots = buildTreeFromItems(items);

    // Assert
    expect(roots.map((r) => r.label)).toEqual(["about", "news"]);

    const news = roots.find((r) => r.path === "/news");
    expect(news).toBeTruthy();
    expect(news?.entryId).toBe("1");

    const a = news?.children.find((c) => c.path === "/news/a");
    expect(a).toBeTruthy();
    expect(a?.entryId).toBe("2");

    const b = a?.children.find((c) => c.path === "/news/a/b");
    expect(b).toBeTruthy();
    expect(b?.entryId).toBe("3");
  });

  it("includes root '/' when present in items", () => {
    // Arrange
    const items: TreeItem[] = [
      { entryId: "1", contentTypeId: "page", path: "/", state: "published" },
    ];

    // Act
    const roots = buildTreeFromItems(items);

    // Assert
    expect(roots.some((r) => r.path === "/")).toBe(true);
  });
});

describe("filterTreeByQuery", () => {
  it("keeps matching nodes and required ancestors", () => {
    // Arrange
    const items: TreeItem[] = [
      {
        entryId: "1",
        contentTypeId: "page",
        path: "/news",
        state: "published",
      },
      {
        entryId: "2",
        contentTypeId: "page",
        path: "/news/a",
        state: "published",
      },
      {
        entryId: "3",
        contentTypeId: "page",
        path: "/about",
        state: "published",
      },
    ];
    const tree = buildTreeFromItems(items);

    // Act
    const filtered = filterTreeByQuery(tree, "news/a");

    // Assert
    expect(filtered.some((n) => n.path === "/about")).toBe(false);

    const news = filtered.find((n) => n.path === "/news");
    expect(news).toBeTruthy();
    expect(news?.children.some((c) => c.path === "/news/a")).toBe(true);
  });
});
