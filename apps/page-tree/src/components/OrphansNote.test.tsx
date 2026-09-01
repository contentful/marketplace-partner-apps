import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrphansNote } from "./OrphansNote";
import type { MissingPathEntry, TreeItem } from "../core/types";

function missing(id: string, title?: string): MissingPathEntry {
  return { entryId: id, contentTypeId: "page", title, state: "draft" };
}

function orphan(id: string, path: string): TreeItem {
  return {
    entryId: id,
    contentTypeId: "page",
    path,
    title: `Title ${id}`,
    state: "published",
  };
}

describe("OrphansNote", () => {
  it("renders nothing when there are no orphans", () => {
    const { container } = render(
      <OrphansNote missingPaths={[]} orphanItems={[]} onOpenEntry={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the total count and both sections", () => {
    render(
      <OrphansNote
        missingPaths={[missing("m1", "Lost Page")]}
        orphanItems={[orphan("o1", "/a/b/c")]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Orphaned pages detected (2)"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lost Page/)).toBeInTheDocument();
    expect(screen.getByText(/\/a\/b\/c/)).toBeInTheDocument();
  });

  it("caps each list at 10 and reports the remainder", () => {
    const many = Array.from({ length: 12 }, (_, i) => missing(`m${i}`));
    render(
      <OrphansNote
        missingPaths={many}
        orphanItems={[]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Showing 10 of 12 entries without a path/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Open").length).toBe(10);
  });

  it("opens the right entry", () => {
    const onOpenEntry = vi.fn();
    render(
      <OrphansNote
        missingPaths={[missing("m1", "Lost Page")]}
        orphanItems={[]}
        onOpenEntry={onOpenEntry}
      />,
    );

    fireEvent.click(screen.getByText("Open"));
    expect(onOpenEntry).toHaveBeenCalledWith("m1");
  });
});
