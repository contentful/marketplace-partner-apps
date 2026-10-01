// src/components/PageTree.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { SidebarAppSDK } from "@contentful/app-sdk";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Text,
  TextLink,
  Tooltip,
} from "@contentful/f36-components";
import * as Icons from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";

import type {
  AppConfig,
  MissingPathEntry,
  SdkWithCma,
  TreeItem,
  TreeNode,
  TreeSourceConfig,
} from "../core/types";
import { SITEMAP_PAGE_PATH } from "../config/defaults";
import { buildPath, normalizePath } from "../core/path";
import { buildTreeFromItems } from "../core/tree";
import { computeOrphanPaths, findOrphanItems } from "../core/orphans";
import { loadSitemapItems, type DuplicatePath } from "../core/sitemapData";

// All colors, spacing, radii, and type come from Forma 36 tokens so the
// sidebar matches the Contentful web app exactly.
const styles = {
  container: css({
    padding: tokens.spacingS,
    fontFamily: tokens.fontStackPrimary,
  }),

  headerRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingXs,
  }),

  tree: css({ marginTop: tokens.spacingS }),

  nodeRow: css({
    display: "grid",
    gridTemplateColumns: "18px 18px 1fr", // caret | icon | pill
    alignItems: "center",
    columnGap: tokens.spacingXs,
    padding: `${tokens.spacing2Xs} 0`,
    userSelect: "none",
  }),

  caretBtn: css({
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadiusSmall,
    cursor: "pointer",
    ":hover": { background: tokens.gray200 },
  }),

  caretSpacer: css({
    width: 18,
    height: 18,
    display: "inline-block",
  }),

  pill: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingXs,
    padding: `${tokens.spacing2Xs} ${tokens.spacingS}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray200}`,
    background: tokens.colorWhite,
    minHeight: 32,
    width: "100%",
    cursor: "pointer",
    ":hover": { background: tokens.gray100 },
  }),

  pillDisabled: css({
    cursor: "default",
    opacity: 0.65,
  }),

  pillText: css({
    fontSize: tokens.fontSizeM,
    lineHeight: tokens.lineHeightM,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  hint: css({ marginTop: tokens.spacingXs }),
};

type SysInfo = { contentTypeId: string };

type EntryFieldAPI = {
  getValue: () => Promise<unknown>;
  onValueChanged: (cb: (value: unknown) => void) => () => void;
};

function getLocalizedString(fieldValue: unknown, locale: string): string | null {
  if (typeof fieldValue === "string") return fieldValue;

  if (fieldValue && typeof fieldValue === "object") {
    const obj = fieldValue as Record<string, unknown>;
    const localized = obj?.[locale];
    if (typeof localized === "string") return localized;

    const first = Object.values(obj).find((v) => typeof v === "string");
    return typeof first === "string" ? first : null;
  }

  return null;
}

async function readSysInfo(sdk: SidebarAppSDK): Promise<SysInfo> {
  const sys = await sdk.entry.getSys();
  const contentTypeId = sys?.contentType?.sys?.id;
  return {
    contentTypeId: typeof contentTypeId === "string" ? contentTypeId : "",
  };
}

function chooseSourceForContentType(
  sources: TreeSourceConfig[] | undefined,
  contentTypeId: string,
): TreeSourceConfig | null {
  if (!sources?.length) return null;
  return sources.find((s) => s.contentTypeId === contentTypeId) ?? null;
}

function findNodeByPath(roots: TreeNode[], path: string): TreeNode | null {
  const target = normalizePath(path);
  if (!target) return null;

  const stack: TreeNode[] = [...roots];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.path === target) return n;
    for (let i = n.children.length - 1; i >= 0; i--) {
      stack.push(n.children[i]);
    }
  }
  return null;
}

export default function PageTree({ sdk, config }: { sdk: SidebarAppSDK; config: AppConfig }) {
  const locale = sdk.locales.default;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sysInfo, setSysInfo] = useState<SysInfo>({ contentTypeId: "" });

  const [items, setItems] = useState<TreeItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePath[]>([]);
  const [missingPaths, setMissingPaths] = useState<MissingPathEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  // UI expand/collapse state (by path)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  const openFullSitemap = () => {
    sdk.navigator.openCurrentAppPage({
      path: `${SITEMAP_PAGE_PATH}?root=${encodeURIComponent(currentPath || "")}`,
    });
  };

  // Load sys info + all entries for configured sources
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const sys = await readSysInfo(sdk);
        if (!mounted) return;
        setSysInfo(sys);

        const sources = config.sources ?? [];
        if (!sources.length) {
          setItems([]);
          setDuplicates([]);
          setMissingPaths([]);
          return;
        }

        const res = await loadSitemapItems({
          // SidebarAppSDK is structurally compatible; we only need the CMA surface.
          sdk: sdk as unknown as SdkWithCma,
          sources,
          locale,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        });

        if (!mounted) return;
        setDuplicates(res.duplicates);
        setMissingPaths(res.missingPaths);
        setItems(res.items);
      } catch (e: unknown) {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : "Failed to load sitemap items.";
        setError(message);
      } finally {
        // no-unsafe-finally: never return from finally
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [sdk, locale, config.sources]);

  // Track current entry path live based on its configured source
  useEffect(() => {
    const source = chooseSourceForContentType(config.sources, sysInfo.contentTypeId);

    const pathFieldId = source?.pathFieldId ?? "slug";
    const routePrefix = source?.routePrefix ?? "";

    const field = (sdk.entry.fields as Record<string, EntryFieldAPI | undefined>)[pathFieldId];

    if (!field) {
      setCurrentPath("");
      return;
    }

    const readAndSet = async (value?: unknown) => {
      const v = value ?? (await field.getValue());
      const raw = typeof v === "string" ? v : (getLocalizedString(v, locale) ?? "");
      setCurrentPath(buildPath(routePrefix, raw));
    };

    // initial read
    void readAndSet();

    // subscribe
    const off = field.onValueChanged((v: unknown) => {
      void readAndSet(v);
    });

    return () => off();
  }, [sdk, locale, config.sources, sysInfo.contentTypeId]);

  // Expand root by default when currentPath changes
  useEffect(() => {
    if (!currentPath) return;
    setExpanded(new Set([normalizePath(currentPath)]));
  }, [currentPath]);

  const toggle = (path: string) => {
    const p = normalizePath(path);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const openInEditor = (entryId: string) => {
    sdk.navigator.openEntry(entryId, { slideIn: true });
  };

  const fullTree = useMemo(() => buildTreeFromItems(items), [items]);

  const orphanPaths = useMemo(
    () => (config.detectOrphans !== false ? computeOrphanPaths(items) : new Set<string>()),
    [items, config.detectOrphans],
  );
  const orphanItems = useMemo(
    () => (config.detectOrphans !== false ? findOrphanItems(items) : []),
    [items, config.detectOrphans],
  );

  const structuralIssueCount =
    duplicates.length +
    (config.detectOrphans !== false ? missingPaths.length + orphanItems.length : 0);

  const subtree = useMemo(() => {
    if (!currentPath) return [];
    const node = findNodeByPath(fullTree, currentPath);
    return node ? [node] : [];
  }, [fullTree, currentPath]);

  const renderNode = (n: TreeNode, depth: number, isRoot: boolean) => {
    const hasChildren = n.children.length > 0;
    const isOpen = expanded.has(n.path);
    const canClick = Boolean(n.entryId);

    return (
      <div key={n.path}>
        <div className={styles.nodeRow} style={{ paddingLeft: depth * 14 }}>
          {/* caret */}
          {hasChildren ? (
            <span
              className={styles.caretBtn}
              onClick={() => toggle(n.path)}
              title={isOpen ? "Collapse" : "Expand"}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(n.path);
                }
              }}
            >
              {isOpen ? (
                <Icons.CaretDownIcon size="small" />
              ) : (
                <Icons.CaretRightIcon size="small" />
              )}
            </span>
          ) : (
            <span className={styles.caretSpacer} />
          )}

          {/* icon */}
          {isRoot ? <Icons.HouseIcon size="small" /> : <Icons.FileCodeIcon size="small" />}

          {/* pill */}
          <Tooltip content={n.path} placement="right">
            <div
              className={canClick ? styles.pill : `${styles.pill} ${styles.pillDisabled}`}
              onClick={() => (canClick ? openInEditor(n.entryId!) : undefined)}
              role={canClick ? "button" : undefined}
              tabIndex={canClick ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && canClick) {
                  e.preventDefault();
                  openInEditor(n.entryId!);
                }
              }}
              aria-label={canClick ? `Open entry: ${n.label}` : `No entry for ${n.path}`}
            >
              <span className={styles.pillText}>{isRoot ? n.path : n.label}</span>
              {orphanPaths.has(n.path) && (
                <Badge variant="warning" size="small" title="Parent path has no entry behind it">
                  Orphan
                </Badge>
              )}
            </div>
          </Tooltip>
        </div>

        {hasChildren && isOpen && n.children.map((c) => renderNode(c, depth + 1, false))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Heading as="h3" marginBottom="none">
          PageTree
        </Heading>
        <Button variant="secondary" size="small" onClick={openFullSitemap}>
          Open Full Sitemap
        </Button>
      </div>

      {error && (
        <Note variant="negative" title="Error" style={{ marginBottom: 8 }}>
          {error}
        </Note>
      )}

      {/* Compact summary only — the Full Sitemap page shows the details.
          Space-wide warnings shouldn't dominate the sidebar of every entry. */}
      {!error && structuralIssueCount > 0 && (
        <Note variant="warning" style={{ marginBottom: 8 }}>
          <Text fontSize="fontSizeS">
            {structuralIssueCount} structural issue
            {structuralIssueCount === 1 ? "" : "s"} detected in this space.{" "}
          </Text>
          <TextLink as="button" onClick={openFullSitemap}>
            View in Full Sitemap
          </TextLink>
        </Note>
      )}

      {loading && <Text fontColor="gray600">Loading…</Text>}

      {!loading && !currentPath && (
        <Box className={styles.hint}>
          <Paragraph marginBottom="none">This entry has no configured path field yet.</Paragraph>
        </Box>
      )}

      {!loading && currentPath && subtree.length === 0 && (
        <Box className={styles.hint}>
          <Paragraph marginBottom="none">
            No matching pages found for <b>{currentPath}</b>.
          </Paragraph>
        </Box>
      )}

      {!loading && currentPath && subtree.length > 0 && (
        <div className={styles.tree}>{subtree.map((n) => renderNode(n, 0, true))}</div>
      )}

      {!loading && currentPath && (
        <Flex className={styles.hint} marginTop="spacingS">
          <Text fontColor="gray600" fontSize="fontSizeS">
            Rooted at <b>{currentPath}</b>. Click any node to open the entry.
          </Text>
        </Flex>
      )}
    </div>
  );
}
