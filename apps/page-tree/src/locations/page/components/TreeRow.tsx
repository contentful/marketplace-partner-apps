// src/locations/page/components/TreeRow.tsx
import React from "react";
import { Badge, IconButton } from "@contentful/f36-components";
import * as Icons from "@contentful/f36-icons";
import type { TreeNode, ContentState } from "../../../core/types";
import { styles } from "../styles";
import { InfoPopover } from "./InfoPopover";

function badgeForState(state: ContentState) {
  switch (state) {
    case "published":
      return { variant: "positive" as const, label: "Published" };
    case "changed":
      return { variant: "primary" as const, label: "Changed" };
    case "draft":
    default:
      return { variant: "warning" as const, label: "Draft" };
  }
}

export function TreeRow(props: {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isOrphan?: boolean;
  onToggle: (path: string) => void;
  onOpen: (entryId: string) => void;
}) {
  const { node, depth, isExpanded, hasChildren, isOrphan, onToggle, onOpen } =
    props;
  const canOpen = Boolean(node.entryId);

  const badge = node.state ? badgeForState(node.state) : null;

  return (
    <div
      className={`${styles.nodeRow} nodeRow`}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      {hasChildren ? (
        <span
          className={styles.caret}
          onClick={() => onToggle(node.path)}
          title={isExpanded ? "Collapse" : "Expand"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(node.path);
            }
          }}
        >
          {isExpanded ? (
            <Icons.CaretDownIcon size="small" />
          ) : (
            <Icons.CaretRightIcon size="small" />
          )}
        </span>
      ) : (
        <span className={styles.caretSpacer} />
      )}

      <Icons.FileCodeIcon size="small" />

      <div
        className={
          canOpen ? styles.pill : `${styles.pill} ${styles.pillDisabled}`
        }
        onClick={() => (canOpen ? onOpen(node.entryId!) : undefined)}
        role={canOpen ? "button" : undefined}
        tabIndex={canOpen ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canOpen) {
            e.preventDefault();
            onOpen(node.entryId!);
          }
        }}
        aria-label={
          canOpen ? `Open entry: ${node.label}` : `No entry for ${node.path}`
        }
        title={node.path}
      >
        <span className={styles.labelText}>{node.label}</span>
        <span style={{ display: "inline-flex", gap: 6 }}>
          {isOrphan && (
            <Badge
              variant="warning"
              size="small"
              title="Parent path has no entry behind it"
            >
              Orphan
            </Badge>
          )}
          {badge && (
            <Badge variant={badge.variant} size="small" title={badge.label}>
              {badge.label}
            </Badge>
          )}
        </span>
      </div>

      <InfoPopover node={node} />

      <div className={styles.rowAction}>
        <IconButton
          aria-label={canOpen ? `Open ${node.label}` : "No entry to open"}
          icon={<Icons.CaretRightIcon />} // safe icon; swap if you want
          variant="transparent"
          size="small"
          isDisabled={!canOpen}
          onClick={() => (canOpen ? onOpen(node.entryId!) : undefined)}
        />
      </div>
    </div>
  );
}
