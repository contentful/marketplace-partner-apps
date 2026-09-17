// src/core/orphans.ts
import type { TreeItem } from "./types";
import { normalizePath } from "./path";

/**
 * Ghost-parent orphans: pages whose direct parent path has no real entry
 * behind it. The tree still renders them (intermediate nodes are
 * synthesized), but the parent URL would 404 on the site.
 *
 * Rules:
 * - Top-level pages (parent is "/") are never orphans.
 * - A page is an orphan if its direct parent path is not backed by any entry.
 */
export function parentPathOf(path: string): string {
  const p = normalizePath(path);
  if (!p || p === "/") return "";
  const idx = p.lastIndexOf("/");
  return idx <= 0 ? "/" : p.slice(0, idx);
}

export function computeOrphanPaths(items: TreeItem[]): Set<string> {
  const entryPaths = new Set(
    items.map((i) => normalizePath(i.path)).filter(Boolean),
  );

  const orphans = new Set<string>();

  for (const item of items) {
    const p = normalizePath(item.path);
    if (!p || p === "/") continue;

    const parent = parentPathOf(p);
    if (!parent || parent === "/") continue; // top-level pages are fine

    if (!entryPaths.has(parent)) orphans.add(p);
  }

  return orphans;
}

/** Items flagged as ghost-parent orphans, sorted by path for stable UI. */
export function findOrphanItems(items: TreeItem[]): TreeItem[] {
  const orphanPaths = computeOrphanPaths(items);
  return items
    .filter((i) => orphanPaths.has(normalizePath(i.path)))
    .sort((a, b) => a.path.localeCompare(b.path));
}
