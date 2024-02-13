import React from "react";
import { Stack, Pill, Text } from "@contentful/f36-components";
import { Product } from "../types/Product";

interface Props {
  products: Array<Product>;
  onRemoveItem: (sku: string) => void;
}

const ProductBasket = ({ products, onRemoveItem }: Props) => (
  <Stack alignItems="center" flexDirection="column">
    {products.length ? (
      products.map(({ brand, title, sku, price }, i) => (
        <Pill
          label={`${brand} - ${title} - ${price} - ${sku}`}
          key={i}
          onClose={() => onRemoveItem(sku)}
          style={{ width: "85%" }}
        />
      ))
    ) : (
      <Text
        fontColor="gray500"
        fontStack="fontStackPrimary"
        fontWeight="fontWeightMedium"
      >
        No product(s) selected
      </Text>
    )}
  </Stack>
);

export default ProductBasket;
