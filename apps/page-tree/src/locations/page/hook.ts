import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageAppSDK } from "@contentful/app-sdk";

import type {
  MissingPathEntry,
  SdkWithCma,
  TreeItem,
  TreeNode,
  TreeSourceConfig,
} from "../../core/types";
import type { DuplicatePath } from "../../core/sitemapData";

import { normalizePath, isUnderRoot } from "../../core/path";
import { buildTreeFromItems, filterTreeByQuery } from "../../core/tree";
import { clearSitemapCache, loadSitemapItems } from "../../core/sitemapData";

export function useSpaceName(sdk: PageAppSDK) {
  const [spaceName, setSpaceName] = useState("");

  useEffect(() => {
    let mounted = true;
    sdk.cma.space.get({ spaceId: sdk.ids.space }).then((space) => {
      if (mounted) setSpaceName(space.name);
    });
    return () => {
      mounted = false;
    };
  }, [sdk]);

  return spaceName;
}

export function useRootPathFromUrl() {
  const [rootPath, setRootPath] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const root = url.searchParams.get("root") || "";
    setRootPath(normalizePath(root));
  }, []);

  return rootPath;
}

export function useSitemapData(args: {
  sdk: PageAppSDK & SdkWithCma;
  sources: TreeSourceConfig[];
  locale: string;
  enabled: boolean;
}) {
  const { sdk, sources, locale, enabled } = args;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TreeItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePath[]>([]);
  const [missingPaths, setMissingPaths] = useState<MissingPathEntry[]>([]);
  // Bumped by refresh() to force a re-fetch past the in-memory cache.
  const [reloadNonce, setReloadNonce] = useState(0);

  const refresh = useCallback(() => {
    clearSitemapCache();
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) return;
      setLoading(true);
      setError(null);

      try {
        const res = await loadSitemapItems({
          sdk,
          sources,
          locale,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        });
        if (!mounted) return;
        setItems(res.items);
        setDuplicates(res.duplicates);
        setMissingPaths(res.missingPaths);
      } catch (e: unknown) {
        if (!mounted) return;
        const message =
          e instanceof Error ? e.message : "Failed to load sitemap data.";
        setError(message);
        setItems([]);
        setDuplicates([]);
        setMissingPaths([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [sdk, sources, locale, enabled, reloadNonce]);

  return { loading, error, items, duplicates, missingPaths, refresh };
}

export function useTreeViewModel(args: {
  items: TreeItem[];
  rootPath: string;
  query: string;
}) {
  const { items, rootPath, query } = args;

  const rootFilteredItems = useMemo(() => {
    if (!rootPath) return items;
    return items.filter((i) => isUnderRoot(i.path, rootPath));
  }, [items, rootPath]);

  const tree = useMemo(
    () => buildTreeFromItems(rootFilteredItems),
    [rootFilteredItems],
  );

  const filteredTree = useMemo(
    () => filterTreeByQuery(tree, query),
    [tree, query],
  );

  const nodeCount = useMemo(() => {
    let count = 0;
    const stack = [...filteredTree];
    while (stack.length) {
      const n = stack.pop()!;
      count += 1;
      stack.push(...n.children);
    }
    return count;
  }, [filteredTree]);

  return { filteredTree, nodeCount };
}

export function collectAllExpandablePaths(nodes: TreeNode[], set: Set<string>) {
  for (const n of nodes) {
    if (n.children.length > 0) set.add(n.path);
    collectAllExpandablePaths(n.children, set);
  }
}
