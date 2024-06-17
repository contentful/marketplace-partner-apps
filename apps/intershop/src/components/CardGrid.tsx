import React from "react";
import { Card, Flex, Grid, GridItem, Text } from "@contentful/f36-components";
import { default as ProductCard, Props as CardProps } from "./ProductCard";

interface CardType extends Omit<CardProps, "onClick"> {
  canBeClicked?: boolean;
  sku: string;
}

interface Props {
  loading?: boolean;
  placeholder: string;
  cards: Array<CardType>;
  onCardClick: (sku: string, isSelected: boolean) => void;
}

const CardGrid = ({ loading, placeholder, cards, onCardClick }: Props) => (
  <Grid
    columns="repeat(5, 1fr)"
    rows="repeat(2, 50%)"
    style={{ height: "100%" }}
    rowGap="spacingM"
  >
    {cards.length ? (
      cards.map(({ canBeClicked, sku, selected, ...card }, i) => (
        <GridItem key={i}>
          <ProductCard
            {...card}
            identifier={sku}
            selected={selected}
            onClick={
              canBeClicked
                ? () => onCardClick(sku, selected ?? false)
                : undefined
            }
            style={{
              height: "100%",
            }}
          />
        </GridItem>
      ))
    ) : loading ? (
      Array.from({ length: 5 }).map((_, i) => (
        <Card isLoading key={i} style={{ width: "100%" }} />
      ))
    ) : (
      <GridItem columnStart={1} columnEnd={-1}>
        <Flex
          justifyContent="center"
          alignItems="center"
          style={{ height: "100%" }}
        >
          <Text>{placeholder}</Text>
        </Flex>
      </GridItem>
    )}
  </Grid>
);

export default CardGrid;
