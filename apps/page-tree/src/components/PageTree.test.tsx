import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { SidebarAppSDK } from "@contentful/app-sdk";
import PageTree from "./PageTree";
import type { AppConfig } from "../core/types";

/**
 * Sidebar integration test with a fully mocked SDK.
 *
 * Fixture space:
 *  - /news            (e1, current entry)
 *  - /news/a          (e2)  ← also claimed by e3 → duplicate
 *  - (no slug)        (e4)  → missing-path orphan
 *  - /news/x/y        (e5)  → ghost-parent orphan (/news/x has no entry)
 */

function cmaEntry(id: string, fields: Record<string, unknown>) {
  return { sys: { id, version: 4, publishedVersion: 3 }, fields };
}

const entries = [
  cmaEntry("e1", { slug: "/news", title: "News" }),
  cmaEntry("e2", { slug: "/news/a", title: "A Page" }),
  cmaEntry("e3", { slug: "/news/a", title: "A Page Copy" }),
  cmaEntry("e4", { title: "Lost Page" }),
  cmaEntry("e5", { slug: "/news/x/y", title: "Deep Page" }),
];

const config: AppConfig = {
  baseUrl: "https://example.com",
  locale: "en-US",
  sources: [{ contentTypeId: "page", pathFieldId: "slug", titleFieldId: "title" }],
};

function makeSdk() {
  return {
    window: { startAutoResizer: vi.fn() },
    locales: { default: "en-US" },
    ids: { space: "sp", environment: "master" },
    entry: {
      getSys: vi.fn().mockResolvedValue({ contentType: { sys: { id: "page" } } }),
      fields: {
        slug: {
          getValue: vi.fn().mockResolvedValue("/news"),
          onValueChanged: vi.fn(() => () => {}),
        },
      },
    },
    cma: {
      entry: { getMany: vi.fn(async () => ({ items: entries })) },
    },
    navigator: {
      openEntry: vi.fn(),
      openCurrentAppPage: vi.fn(),
    },
  };
}

describe("PageTree (sidebar)", () => {
  it("renders the subtree rooted at the current entry and a compact issues summary", async () => {
    const sdk = makeSdk();
    render(<PageTree sdk={sdk as unknown as SidebarAppSDK} config={config} />);

    // Root pill shows the current path once data has loaded.
    // (Query by accessible name: the f36 Tooltip duplicates the raw "/news"
    // text in the DOM, so a text query would match twice.)
    expect(await screen.findByRole("button", { name: "Open entry: News" })).toBeInTheDocument();

    // Root is expanded by default → direct children visible
    expect(await screen.findByText("A Page")).toBeInTheDocument();

    // Compact summary: 1 duplicate + 1 missing path + 1 ghost parent = 3.
    // The sidebar links to the Full Sitemap instead of listing details.
    expect(screen.getByText(/3 structural issues detected/)).toBeInTheDocument();
    expect(screen.getByText("View in Full Sitemap")).toBeInTheDocument();

    // Full warning panels must NOT render in the narrow sidebar
    expect(screen.queryByText("Duplicate paths detected")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lost Page/)).not.toBeInTheDocument();
  });

  it("opens the Full Sitemap from the compact summary link", async () => {
    const sdk = makeSdk();
    render(<PageTree sdk={sdk as unknown as SidebarAppSDK} config={config} />);

    fireEvent.click(await screen.findByText("View in Full Sitemap"));
    expect(sdk.navigator.openCurrentAppPage).toHaveBeenCalledWith({
      path: expect.stringContaining("/sitemap?root="),
    });
  });

  it("opens the clicked node's entry in a slide-in editor", async () => {
    const sdk = makeSdk();
    render(<PageTree sdk={sdk as unknown as SidebarAppSDK} config={config} />);

    fireEvent.click(await screen.findByText("A Page"));
    expect(sdk.navigator.openEntry).toHaveBeenCalledWith("e2", {
      slideIn: true,
    });
  });

  it("shows a hint when the entry has no configured path field", async () => {
    const sdk = makeSdk();
    // Content type not covered by any source → falls back to "slug", so
    // remove the field entirely to simulate a missing path field.
    (sdk.entry as { fields: Record<string, unknown> }).fields = {};

    render(<PageTree sdk={sdk as unknown as SidebarAppSDK} config={config} />);

    expect(await screen.findByText(/no configured path field/i)).toBeInTheDocument();
  });

  it("when detectOrphans is false, counts only duplicates and shows no Orphan badge", async () => {
    const sdk = makeSdk();
    const noOrphanConfig: AppConfig = { ...config, detectOrphans: false };

    render(<PageTree sdk={sdk as unknown as SidebarAppSDK} config={noOrphanConfig} />);

    // Wait for data to load
    expect(await screen.findByRole("button", { name: "Open entry: News" })).toBeInTheDocument();

    // Only 1 duplicate — missing-path and ghost-parent orphans are excluded
    expect(screen.getByText(/1 structural issue detected/)).toBeInTheDocument();

    // No Orphan badges anywhere in the tree
    expect(screen.queryByText("Orphan")).not.toBeInTheDocument();
  });
});
