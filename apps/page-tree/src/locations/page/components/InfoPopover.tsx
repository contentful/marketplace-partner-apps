import React, { useState } from "react";
import { Box, IconButton, Popover, Text } from "@contentful/f36-components";
import * as Icons from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import type { TreeNode } from "../../../core/types";

export function InfoPopover({ node }: { node: TreeNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const status =
    node.state === "published"
      ? "Published"
      : node.state === "changed"
        ? "Changed"
        : node.state === "draft"
          ? "Draft"
          : "—";

  return (
    <Popover placement="right" isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <Popover.Trigger>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((v) => !v);
          }}
          style={{ display: "inline-flex" }}
        >
          <IconButton
            aria-label={`Show details for ${node.label}`}
            icon={<Icons.InfoIcon />}
            variant="transparent"
            size="small"
          />
        </span>
      </Popover.Trigger>

      <Popover.Content>
        <Box padding="spacingS" style={{ maxWidth: 420 }}>
          <Text fontWeight="fontWeightDemiBold">{node.label}</Text>

          <Box marginTop="spacing2Xs">
            <Text fontColor="gray600" fontSize="fontSizeS">
              Path
            </Text>
            <Text
              fontSize="fontSizeS"
              style={{
                fontFamily: tokens.fontStackMonospace,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={node.path}
            >
              {node.path}
            </Text>
          </Box>

          <Box marginTop="spacing2Xs">
            <Text fontColor="gray600" fontSize="fontSizeS">
              Status: {status}
            </Text>
          </Box>
        </Box>
      </Popover.Content>
    </Popover>
  );
}
