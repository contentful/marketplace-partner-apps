import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DuplicatesNote } from "./DuplicatesNote";
import type { DuplicatePath } from "../core/sitemapData";

const duplicates: DuplicatePath[] = [
  {
    path: "/news/foo",
    entries: [
      {
        entryId: "e1",
        contentTypeId: "page",
        path: "/news/foo",
        title: "Foo",
        state: "published",
      },
      {
        entryId: "e2",
        contentTypeId: "page",
        path: "/news/foo",
        title: "Foo Copy",
        state: "draft",
      },
    ],
  },
];

describe("DuplicatesNote", () => {
  it("renders nothing when there are no duplicates", () => {
    const { container } = render(
      <DuplicatesNote duplicates={[]} onOpenEntry={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("lists the duplicate path and every conflicting entry", () => {
    render(<DuplicatesNote duplicates={duplicates} onOpenEntry={vi.fn()} />);

    expect(screen.getByText("Duplicate paths detected")).toBeInTheDocument();
    expect(screen.getByText("Duplicate path: /news/foo")).toBeInTheDocument();
    expect(screen.getByText(/Foo —/)).toBeInTheDocument();
    expect(screen.getByText(/Foo Copy —/)).toBeInTheDocument();
  });

  it("opens the clicked entry", () => {
    const onOpenEntry = vi.fn();
    render(<DuplicatesNote duplicates={duplicates} onOpenEntry={onOpenEntry} />);

    fireEvent.click(screen.getAllByText("Open")[1]);
    expect(onOpenEntry).toHaveBeenCalledWith("e2");
  });
});
