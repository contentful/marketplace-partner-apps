import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SitemapTree } from "./SitemapTree";
import type { TreeNode } from "../../../core/types";

const noop = () => {};

const child: TreeNode = {
  path: "/news/a",
  label: "A Page",
  entryId: "e2",
  state: "draft",
  children: [],
};

const root: TreeNode = {
  path: "/news",
  label: "News",
  entryId: "e1",
  state: "published",
  children: [child],
};

describe("SitemapTree", () => {
  it("hides children of collapsed nodes", () => {
    render(
      <SitemapTree
        roots={[root]}
        expanded={new Set()}
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.queryByText("A Page")).not.toBeInTheDocument();
  });

  it("renders children of expanded nodes", () => {
    render(
      <SitemapTree
        roots={[root]}
        expanded={new Set(["/news"])}
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.getByText("A Page")).toBeInTheDocument();
  });

  it("marks rows whose path is in orphanPaths", () => {
    render(
      <SitemapTree
        roots={[root]}
        expanded={new Set(["/news"])}
        orphanPaths={new Set(["/news/a"])}
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.getByText("Orphan")).toBeInTheDocument();
  });
});
