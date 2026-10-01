import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PageAppSDK } from "@contentful/app-sdk";
import { clearSitemapCache } from "../core/sitemapData";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

import { useSDK } from "@contentful/react-apps-toolkit";
import Page from "./Page";

function makeSdk({ rejectCma = false, installationParams = {} } = {}) {
  return {
    locales: { default: "en-US" },
    ids: { space: "sp", environment: "master", environmentAlias: undefined },
    parameters: {
      installation: {
        baseUrl: "https://example.com",
        locale: "en-US",
        sources: [{ contentTypeId: "page", pathFieldId: "slug" }],
        ...installationParams,
      },
    },
    cma: {
      space: { get: vi.fn().mockResolvedValue({ name: "My Space" }) },
      entry: {
        getMany: rejectCma
          ? vi.fn().mockRejectedValue(new Error("API unavailable"))
          : vi.fn().mockResolvedValue({ items: [] }),
      },
    },
    navigator: { openEntry: vi.fn() },
  };
}

describe("Page — data-fetch errors", () => {
  beforeEach(() => {
    vi.mocked(useSDK).mockReset();
  });

  it("shows an error Note and suppresses 'No results' when CMA rejects", async () => {
    vi.mocked(useSDK).mockReturnValue(makeSdk({ rejectCma: true }) as unknown as PageAppSDK);

    render(<Page />);

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/No results/)).not.toBeInTheDocument();
  });

  it("shows 'No results' when CMA succeeds but returns no entries", async () => {
    vi.mocked(useSDK).mockReturnValue(makeSdk({ rejectCma: false }) as unknown as PageAppSDK);

    render(<Page />);

    expect(await screen.findByText(/No results/)).toBeInTheDocument();
    expect(screen.queryByText("API unavailable")).not.toBeInTheDocument();
  });
});

// Entries that trigger orphan detection:
//  - e_missing: no slug → missing-path orphan
//  - e_ghost: /a/b/c with no entry for /a/b → ghost-parent orphan
const orphanEntries = [
  { sys: { id: "e_root", version: 2, publishedVersion: 1 }, fields: { slug: "/a" } },
  { sys: { id: "e_ghost", version: 2, publishedVersion: 1 }, fields: { slug: "/a/b/c" } },
  { sys: { id: "e_missing", version: 2, publishedVersion: 1 }, fields: {} },
];

describe("Page — detectOrphans flag", () => {
  beforeEach(() => {
    vi.mocked(useSDK).mockReset();
    clearSitemapCache();
  });

  it("shows OrphansNote when detectOrphans is omitted (default ON)", async () => {
    const sdk = makeSdk({ installationParams: {} });
    sdk.cma.entry.getMany = vi.fn().mockResolvedValue({ items: orphanEntries });
    vi.mocked(useSDK).mockReturnValue(sdk as unknown as PageAppSDK);

    render(<Page />);

    expect(await screen.findByText(/Orphaned pages detected/)).toBeInTheDocument();
  });

  it("hides OrphansNote when detectOrphans is false", async () => {
    const sdk = makeSdk({ installationParams: { detectOrphans: false } });
    sdk.cma.entry.getMany = vi.fn().mockResolvedValue({ items: orphanEntries });
    vi.mocked(useSDK).mockReturnValue(sdk as unknown as PageAppSDK);

    render(<Page />);

    // Wait for data load
    await screen.findByText(/No results|All pages/);

    expect(screen.queryByText(/Orphaned pages detected/)).not.toBeInTheDocument();
  });
});
