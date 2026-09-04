import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSitemapData } from "./hook";
import { clearSitemapCache } from "../../core/sitemapData";
import type { SdkWithCma, TreeSourceConfig } from "../../core/types";
import type { PageAppSDK } from "@contentful/app-sdk";

const sources: TreeSourceConfig[] = [
  { contentTypeId: "page", pathFieldId: "slug" },
];

function makeRejectingSdk(message = "API unavailable"): PageAppSDK & SdkWithCma {
  return {
    cma: {
      entry: {
        getMany: vi.fn().mockRejectedValue(new Error(message)),
      },
    },
    ids: { space: "sp", environment: "master" },
  } as unknown as PageAppSDK & SdkWithCma;
}

function makeSucceedingSdk(): PageAppSDK & SdkWithCma {
  return {
    cma: {
      entry: { getMany: vi.fn().mockResolvedValue({ items: [] }) },
    },
    ids: { space: "sp", environment: "master" },
  } as unknown as PageAppSDK & SdkWithCma;
}

describe("useSitemapData", () => {
  beforeEach(() => clearSitemapCache());

  it("sets error when CMA rejects and clears items/duplicates/missingPaths", async () => {
    const sdk = makeRejectingSdk("API unavailable");

    const { result } = renderHook(() =>
      useSitemapData({ sdk, sources, locale: "en-US", enabled: true }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("API unavailable");
    expect(result.current.items).toEqual([]);
    expect(result.current.duplicates).toEqual([]);
    expect(result.current.missingPaths).toEqual([]);
  });

  it("error is null and items load on success", async () => {
    const sdk = makeSucceedingSdk();

    const { result } = renderHook(() =>
      useSitemapData({ sdk, sources, locale: "en-US", enabled: true }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
  });

  it("refresh() busts the cache and re-fetches", async () => {
    const sdk = makeSucceedingSdk();
    const getMany = vi.mocked(sdk.cma.entry.getMany);

    const { result } = renderHook(() =>
      useSitemapData({ sdk, sources, locale: "en-US", enabled: true }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMany).toHaveBeenCalledTimes(1);

    act(() => result.current.refresh());

    // Cache is cleared, so the effect re-runs and hits the CMA again.
    await waitFor(() => expect(getMany).toHaveBeenCalledTimes(2));
  });

  it("does not load when enabled is false", async () => {
    const sdk = makeSucceedingSdk();
    const getMany = vi.mocked(sdk.cma.entry.getMany);

    const { result } = renderHook(() =>
      useSitemapData({ sdk, sources, locale: "en-US", enabled: false }),
    );

    // loading starts true, stays true (effect returns early)
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(getMany).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
