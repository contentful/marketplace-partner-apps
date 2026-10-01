// src/components/DuplicatesNote.tsx
import React from "react";
import {
  Box,
  Button,
  Flex,
  Note,
  Paragraph,
  Text,
} from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import type { DuplicatePath } from "../core/sitemapData";

const MAX_LISTED = 10;

export function DuplicatesNote({
  duplicates,
  onOpenEntry,
}: {
  duplicates: DuplicatePath[];
  onOpenEntry: (entryId: string) => void;
}) {
  if (!duplicates.length) return null;

  return (
    <Note
      variant="warning"
      title="Duplicate paths detected"
      style={{ marginBottom: 12 }}
    >
      <Paragraph marginBottom="spacingS">
        Multiple entries resolve to the same path. Only the first entry per path
        is shown. Fix by adjusting <b>routePrefix</b> and/or the{" "}
        <b>path field</b> in configuration.
      </Paragraph>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {duplicates.slice(0, MAX_LISTED).map((d) => (
          <Box
            key={d.path}
            padding="spacingS"
            style={{
              borderColor: tokens.gray300,
              borderWidth: "1px",
              borderStyle: "solid",
              borderRadius: tokens.borderRadiusSmall,
            }}
          >
            <Text fontWeight="fontWeightDemiBold">
              Duplicate path: {d.path}
            </Text>

            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {d.entries.map((e) => (
                <Flex
                  key={e.entryId}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="fontSizeS" fontColor="gray700">
                    {e.title ? `${e.title} — ` : ""}
                    <span style={{ opacity: 0.85 }}>
                      {e.contentTypeId} · {e.entryId}
                    </span>
                  </Text>

                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => onOpenEntry(e.entryId)}
                  >
                    Open
                  </Button>
                </Flex>
              ))}
            </div>
          </Box>
        ))}

        {duplicates.length > MAX_LISTED && (
          <Text fontSize="fontSizeS" fontColor="gray600">
            Showing {MAX_LISTED} of {duplicates.length} duplicate paths.
          </Text>
        )}
      </div>
    </Note>
  );
}
