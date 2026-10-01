// src/locations/page/components/SitemapTree.tsx
import React from "react";
import type { TreeNode } from "../../../core/types";
import { TreeRow } from "./TreeRow";

export function SitemapTree(props: {
  roots: TreeNode[];
  expanded: Set<string>;
  orphanPaths?: Set<string>;
  onToggle: (path: string) => void;
  onOpen: (entryId: string) => void;
}) {
  const { roots, expanded, orphanPaths, onToggle, onOpen } = props;

  const renderNode = (n: TreeNode, depth: number) => {
    const hasChildren = n.children.length > 0;
    const isExpanded = expanded.has(n.path);

    return (
      <div key={n.path}>
        <TreeRow
          node={n}
          depth={depth}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          isOrphan={orphanPaths?.has(n.path) ?? false}
          onToggle={onToggle}
          onOpen={onOpen}
        />

        {hasChildren &&
          isExpanded &&
          n.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return <>{roots.map((n) => renderNode(n, 0))}</>;
}
