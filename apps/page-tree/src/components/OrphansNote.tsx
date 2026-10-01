// src/components/OrphansNote.tsx
import React from "react";
import {
  Box,
  Button,
  Flex,
  Note,
  Paragraph,
  Text,
} from "@contentful/f36-components";
import type { MissingPathEntry, TreeItem } from "../core/types";

const MAX_LISTED = 10;

function EntryRow({
  entryId,
  contentTypeId,
  title,
  detail,
  onOpenEntry,
}: {
  entryId: string;
  contentTypeId: string;
  title?: string;
  detail?: string;
  onOpenEntry: (entryId: string) => void;
}) {
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text fontSize="fontSizeS" fontColor="gray700">
        {title ? `${title} — ` : ""}
        <span style={{ opacity: 0.85 }}>
          {contentTypeId} · {entryId}
          {detail ? ` · ${detail}` : ""}
        </span>
      </Text>

      <Button size="small" variant="secondary" onClick={() => onOpenEntry(entryId)}>
        Open
      </Button>
    </Flex>
  );
}

export function OrphansNote({
  missingPaths,
  orphanItems,
  onOpenEntry,
}: {
  missingPaths: MissingPathEntry[];
  orphanItems: TreeItem[];
  onOpenEntry: (entryId: string) => void;
}) {
  const total = missingPaths.length + orphanItems.length;
  if (!total) return null;

  return (
    <Note
      variant="warning"
      title={`Orphaned pages detected (${total})`}
      style={{ marginBottom: 12 }}
    >
      {missingPaths.length > 0 && (
        <Box marginBottom={orphanItems.length ? "spacingM" : "none"}>
          <Paragraph marginBottom="spacingXs">
            <b>{missingPaths.length}</b> entr{missingPaths.length === 1 ? "y" : "ies"}{" "}
            cannot be placed in the hierarchy because the configured{" "}
            <b>path field</b> is empty:
          </Paragraph>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {missingPaths.slice(0, MAX_LISTED).map((e) => (
              <EntryRow
                key={e.entryId}
                entryId={e.entryId}
                contentTypeId={e.contentTypeId}
                title={e.title}
                onOpenEntry={onOpenEntry}
              />
            ))}
            {missingPaths.length > MAX_LISTED && (
              <Text fontSize="fontSizeS" fontColor="gray600">
                Showing {MAX_LISTED} of {missingPaths.length} entries without a path.
              </Text>
            )}
          </div>
        </Box>
      )}

      {orphanItems.length > 0 && (
        <Box>
          <Paragraph marginBottom="spacingXs">
            <b>{orphanItems.length}</b> page{orphanItems.length === 1 ? "" : "s"}{" "}
            have a parent URL with no entry behind it (the parent path would not
            resolve on your site):
          </Paragraph>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {orphanItems.slice(0, MAX_LISTED).map((e) => (
              <EntryRow
                key={e.entryId}
                entryId={e.entryId}
                contentTypeId={e.contentTypeId}
                title={e.title}
                detail={e.path}
                onOpenEntry={onOpenEntry}
              />
            ))}
            {orphanItems.length > MAX_LISTED && (
              <Text fontSize="fontSizeS" fontColor="gray600">
                Showing {MAX_LISTED} of {orphanItems.length} pages with missing parents.
              </Text>
            )}
          </div>
        </Box>
      )}
    </Note>
  );
}
