import type { TreeItem, TreeNode } from "./types";
import { normalizePath, lastSegment } from "./path";

export function buildTreeFromItems(items: TreeItem[]): TreeNode[] {
  const byPath = new Map<string, TreeNode>();

  const ensureNode = (path: string): TreeNode => {
    const p = normalizePath(path);
    const existing = byPath.get(p);
    if (existing) return existing;

    const created: TreeNode = {
      path: p,
      label: lastSegment(p),
      children: [],
    };

    byPath.set(p, created);
    return created;
  };

  // Create nodes for each segment of each path
  for (const item of items) {
    const p = normalizePath(item.path);
    if (!p) continue;

    const parts = p.replace(/^\/+/, "").split("/").filter(Boolean);
    let current = "";

    for (const seg of parts) {
      current = current ? `${current}/${seg}` : seg;
      ensureNode(`/${current}`);
    }

    if (p === "/") ensureNode("/");
  }

  // Assign entry metadata + label preference for real entries
  for (const item of items) {
    const p = normalizePath(item.path);
    const node = byPath.get(p);
    if (!node) continue;

    node.entryId = item.entryId;
    node.state = item.state;

    // 👇 Title wins for actual entries (keeps intermediate nodes readable)
    if (item.title && item.title.trim()) {
      node.label = item.title.trim();
    }
  }

  // Connect parent/child
  const roots: TreeNode[] = [];

  for (const node of byPath.values()) {
    if (node.path === "/") {
      roots.push(node);
      continue;
    }

    const parentPath = node.path.includes("/")
      ? node.path.slice(0, node.path.lastIndexOf("/")) || "/"
      : "/";

    const parent = byPath.get(parentPath);
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  // Sort (titles now affect ordering too, which is usually what you want)
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    nodes.forEach((n) => sortRec(n.children));
  };

  sortRec(roots);

  return roots;
}

export function filterTreeByQuery(roots: TreeNode[], q: string): TreeNode[] {
  const query = (q ?? "").trim().toLowerCase();
  if (!query) return roots;

  const recur = (n: TreeNode): TreeNode | null => {
    const kids = n.children.map(recur).filter(Boolean) as TreeNode[];
    const keep =
      n.path.toLowerCase().includes(query) ||
      n.label.toLowerCase().includes(query) ||
      kids.length > 0;

    if (!keep) return null;
    return { ...n, children: kids };
  };

  return roots.map(recur).filter(Boolean) as TreeNode[];
}
