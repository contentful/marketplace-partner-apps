import React, { CSSProperties } from "react";
import { IconButton } from "@contentful/f36-components";
import { CloseIcon } from "@contentful/f36-icons";

interface Props {
  aria: string;
  style?: CSSProperties;
  onClick: () => void;
}

const CloseButton = ({ aria, style, onClick }: Props) => (
  <IconButton
    onClick={onClick}
    variant="secondary"
    aria-label={aria}
    icon={<CloseIcon />}
    style={{
      border: "none",
      padding: "0",
      minHeight: "auto",
      boxShadow: "none",
      ...style,
    }}
  />
);

export default CloseButton;
