import { Card, Flex, Text, Tooltip } from "@contentful/f36-components";
import React, { CSSProperties } from "react";
import CloseButton from "./CloseButton";

interface ImageType {
  alt: string;
  src: string;
}

export interface Props {
  selected?: boolean;
  aria?: string;
  identifier?: string;
  price: string;
  subtitle: string;
  title: string;
  warning?: string;
  style?: CSSProperties;
  image: ImageType;
  onClick?: () => void;
  onClose?: () => void;
}

const ProductCard = ({
  selected,
  aria = "Close product",
  identifier,
  price,
  subtitle,
  title,
  warning,
  style,
  image,
  onClick,
  onClose,
}: Props) => {
  const card = (
    <Card
      isSelected={selected}
      onClick={onClick}
      style={{
        position: "relative",
        ...(warning ? { cursor: "not-allowed" } : {}),
        ...style,
      }}
    >
      {onClose && (
        <CloseButton
          aria={aria}
          onClick={onClose}
          style={{ position: "absolute", top: "0.5em", right: "0.5em" }}
        />
      )}
      <Flex
        flexDirection="column"
        justifyContent="space-between"
        alignItems="center"
        fullHeight
      >
        <Flex
          flexDirection="column"
          style={{ marginRight: "auto", maxWidth: "100%", height: "5.25em" }}
        >
          <Text
            fontSize="fontSizeXl"
            fontWeight="fontWeightDemiBold"
            isTruncated
          >
            {title}
          </Text>
          <Text
            fontSize="fontSizeM"
            lineHeight="lineHeightCondensed"
            style={{
              maxHeight: "2.5em",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              display: "-webkit-box",
              overflow: "hidden",
            }}
          >
            {subtitle}
          </Text>
          {identifier && (
            <Text fontSize="fontSizeS" isTruncated>
              {identifier}
            </Text>
          )}
        </Flex>

        <img
          src={image.src}
          alt={image.alt}
          style={{
            maxWidth: "100%",
            height: "50%",
            aspectRatio: "auto 50/50",
          }}
        />
        <Text
          fontColor="blue700"
          fontSize="fontSizeXl"
          fontStack="fontStackMonospace"
          fontWeight="fontWeightDemiBold"
          style={{ marginLeft: "auto" }}
        >
          {price}
        </Text>
      </Flex>
    </Card>
  );

  return warning ? (
    <Tooltip content={warning} placement="top">
      {card}
    </Tooltip>
  ) : (
    card
  );
};

export default ProductCard;
