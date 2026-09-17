// src/locations/Page.tsx
import { useEffect, useMemo, useState } from "react";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Note, Text } from "@contentful/f36-components";

import { useAppConfig } from "../core/useAppConfig";
import { computeOrphanPaths, findOrphanItems } from "../core/orphans";
import {
  collectAllExpandablePaths,
  useRootPathFromUrl,
  useSitemapData,
  useSpaceName,
  useTreeViewModel,
} from "./page/hook";

import { PageShell } from "./page/components/PageShell";
import { SitemapTree } from "./page/components/SitemapTree";
import { DuplicatesNote } from "../components/DuplicatesNote";
import { OrphansNote } from "../components/OrphansNote";

export default function Page() {
  const sdk = useSDK<PageAppSDK>();
  const locale = sdk.locales.default;

  const { config, loading: configLoading, error: configError } = useAppConfig(sdk);

  const spaceName = useSpaceName(sdk);
  const rootPath = useRootPathFromUrl();
  // Prefer the alias name (e.g. "master") over the underlying environment ID
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const {
    loading: dataLoading,
    error: dataError,
    items,
    duplicates,
    missingPaths,
    refresh,
  } = useSitemapData({
    sdk,
    sources: config.sources ?? [],
    locale,
    enabled: !configLoading,
  });

  const { filteredTree, nodeCount } = useTreeViewModel({
    items,
    rootPath,
    query,
  });

  // Orphan detection runs against the full item set (not root-filtered),
  // so a parent outside the current root filter still counts as existing.
  const orphanPaths = useMemo(
    () => (config.detectOrphans !== false ? computeOrphanPaths(items) : new Set<string>()),
    [items, config.detectOrphans],
  );
  const orphanItems = useMemo(
    () => (config.detectOrphans !== false ? findOrphanItems(items) : []),
    [items, config.detectOrphans],
  );

  // Expand top-level nodes when root changes (keep stable while typing)
  useEffect(() => {
    const next = new Set<string>();
    for (const n of filteredTree) {
      if (n.children.length) next.add(n.path);
    }
    setExpanded(next);
  }, [rootPath]);

  const onToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const onExpandAll = () => {
    const next = new Set<string>();
    collectAllExpandablePaths(filteredTree, next);
    setExpanded(next);
  };

  const onCollapseAll = () => setExpanded(new Set());

  const onOpen = (entryId: string) => {
    sdk.navigator.openEntry(entryId, { slideIn: true });
  };

  const loading = configLoading || dataLoading;

  const subtitle = rootPath
    ? `Filtered to: ${rootPath} (+ descendants)`
    : `All pages on ${spaceName} / ${environmentId}`;

  return (
    <PageShell
      title="Full Sitemap"
      subtitle={subtitle}
      configError={configError}
      query={query}
      onQueryChange={setQuery}
      loading={loading}
      nodeCount={nodeCount}
      onExpandAll={onExpandAll}
      onCollapseAll={onCollapseAll}
      onRefresh={refresh}
      topNotices={
        <>
          <DuplicatesNote duplicates={duplicates} onOpenEntry={onOpen} />
          {config.detectOrphans !== false && (
            <OrphansNote
              missingPaths={missingPaths}
              orphanItems={orphanItems}
              onOpenEntry={onOpen}
            />
          )}
        </>
      }
    >
      {dataError && (
        <Note variant="negative" title="Error" style={{ marginBottom: 8 }}>
          {dataError}
        </Note>
      )}

      {loading && <Text fontColor="gray600">Loading…</Text>}

      {!loading && !dataError && filteredTree.length === 0 && (
        <Text fontColor="gray600">No results. Try a different search query.</Text>
      )}

      {!loading && filteredTree.length > 0 && (
        <SitemapTree
          roots={filteredTree}
          expanded={expanded}
          orphanPaths={orphanPaths}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      )}
    </PageShell>
  );
}
