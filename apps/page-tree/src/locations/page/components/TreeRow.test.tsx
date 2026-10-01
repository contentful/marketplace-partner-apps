import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TreeRow } from "./TreeRow";
import type { TreeNode } from "../../../core/types";

function makeNode(over: Partial<TreeNode> = {}): TreeNode {
  return {
    path: "/news/a",
    label: "A Page",
    entryId: "e1",
    state: "published",
    children: [],
    ...over,
  };
}

const noop = () => {};

describe("TreeRow", () => {
  it("renders the label and publication-state badge", () => {
    render(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.getByText("A Page")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("shows an Orphan badge only when isOrphan is set", () => {
    const { rerender } = render(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        isOrphan
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.getByText("Orphan")).toBeInTheDocument();

    rerender(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        onToggle={noop}
        onOpen={noop}
      />,
    );

    expect(screen.queryByText("Orphan")).not.toBeInTheDocument();
  });

  it("opens the entry on click and on Enter", () => {
    const onOpen = vi.fn();
    render(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        onToggle={noop}
        onOpen={onOpen}
      />,
    );

    const pill = screen.getByRole("button", { name: "Open entry: A Page" });
    fireEvent.click(pill);
    fireEvent.keyDown(pill, { key: "Enter" });

    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith("e1");
  });

  it("does not open anything for synthesized nodes without an entry", () => {
    const onOpen = vi.fn();
    render(
      <TreeRow
        node={makeNode({ entryId: undefined, state: undefined })}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        onToggle={noop}
        onOpen={onOpen}
      />,
    );

    fireEvent.click(screen.getByText("A Page"));
    expect(onOpen).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Open entry: A Page" }),
    ).not.toBeInTheDocument();
  });

  it("toggles expansion via the caret (click, Enter, and Space)", () => {
    const onToggle = vi.fn();
    render(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren
        onToggle={onToggle}
        onOpen={noop}
      />,
    );

    const caret = screen.getByTitle("Expand");
    fireEvent.click(caret);
    fireEvent.keyDown(caret, { key: "Enter" });
    fireEvent.keyDown(caret, { key: " " });

    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(onToggle).toHaveBeenCalledWith("/news/a");
  });

  it("opens entry on Space key (pill)", () => {
    const onOpen = vi.fn();
    render(
      <TreeRow
        node={makeNode()}
        depth={0}
        isExpanded={false}
        hasChildren={false}
        onToggle={noop}
        onOpen={onOpen}
      />,
    );

    const pill = screen.getByRole("button", { name: "Open entry: A Page" });
    fireEvent.keyDown(pill, { key: " " });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("e1");
  });
});
