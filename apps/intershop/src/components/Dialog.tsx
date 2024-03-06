import React, { useCallback, useEffect, useRef, useState } from "react";
import CardGrid from "./CardGrid";
import ProductBasket from "./ProductBasket";
import {
  Grid,
  GridItem,
  FormControl,
  TextInput,
  Stack,
  Text,
  Button,
  Flex,
  Note,
} from "@contentful/f36-components";
import { Product } from "../types/Product";
import { Category } from "../types/Category";
import CheckboxTree from "./CheckboxTree";
import { Checkbox as CheckboxType } from "../types/Checkbox";
import LoadingIcon from "./LoadingIcon";

interface Props {
  categoriesLoading: boolean;
  productsLoading: boolean;
  withCategorySelector: boolean;
  excludedProductsCount: number;
  errors: Array<string>;
  categories: Array<Category>;
  products: Array<Product>;
  selectedProducts: Array<Product>;
  onSaveSubmit: () => void;
  onCategorySelect: (id: string) => void;
  onProductSelect: (sku: string, selected: boolean) => void;
  onRequestProducts: ({
    categoryId,
    searchTerm,
    offset,
  }: {
    categoryId?: string;
    searchTerm?: string;
    offset?: number;
  }) => void;
}

const Dialog = ({
  excludedProductsCount,
  categoriesLoading,
  productsLoading,
  withCategorySelector,
  categories,
  products,
  selectedProducts,
  onSaveSubmit,
  onCategorySelect,
  onProductSelect,
  onRequestProducts,
  errors,
}: Props) => {
  const productsGridRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilterProducts, setCategoryFilterProducts] = useState("");
  const [searchOffset, setSearchOffset] = useState(0);
  const [selectedCategoriesTotalProducts, setSelectedCategoriesTotalProducts] =
    useState(0);
  const [checkboxTree, setCheckboxTree] = useState<Array<CheckboxType>>([]);

  const calculateTotalAvailableProducts = useCallback(
    (categories: Array<Category>): number =>
      categories.reduce((acc, { subCategories, totalProducts, selected }) => {
        if (selected) {
          acc += subCategories.length
            ? calculateTotalAvailableProducts(subCategories)
            : (totalProducts as number);
        }
        return acc;
      }, 0),
    []
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSearchOffset(0);
      setCategoryFilterProducts(categoryId);
      onRequestProducts({ categoryId, offset: 0 });
    },
    [onRequestProducts]
  );

  const handleCategoryCheckboxSelect = useCallback(
    (id: string, selected: boolean) => {
      if (!selected) {
        handleCategorySelect(id);
      }
      onCategorySelect(id);
    },
    [handleCategorySelect, onCategorySelect]
  );

  const handleSearchBoxChange = useCallback(
    (value: string) => {
      setSearchOffset(0);
      setSearchValue(value);
      onRequestProducts({ searchTerm: value, offset: 0 });
    },
    [onRequestProducts]
  );

  const handleProductsGridScroll = useCallback(() => {
    if (!productsLoading && productsGridRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = productsGridRef.current;
      if ((scrollTop + clientHeight) / scrollHeight > 0.8) {
        setSearchOffset((prevSearchOffset) => prevSearchOffset + 20);
        onRequestProducts({
          categoryId: categoryFilterProducts,
          searchTerm: searchValue,
          offset: searchOffset === 0 ? 20 : searchOffset,
        });
      }
    }
  }, [
    categoryFilterProducts,
    onRequestProducts,
    productsLoading,
    searchOffset,
    searchValue,
  ]);

  const makeCheckboxTree = useCallback(
    (categories: Array<Category>) => {
      const categoryTreeContainsId = (
        id: string,
        category: Category
      ): boolean =>
        category.id === id ||
        category.subCategories
          .map((subCategory) => categoryTreeContainsId(id, subCategory))
          .some((containsId) => containsId);

      const makeCheckboxBranch = (category: Category): CheckboxType => {
        const {
          selected: checked = false,
          id,
          title,
          totalProducts,
          subCategories,
        } = category;
        return {
          boldText: categoryTreeContainsId(categoryFilterProducts, category),
          checked,
          id,
          text: `${title} (${totalProducts})`,
          childboxes: subCategories.map((subCategory) =>
            makeCheckboxBranch(subCategory)
          ),
        };
      };

      return categories.map((category) => makeCheckboxBranch(category));
    },
    [categoryFilterProducts]
  );

  useEffect(() => {
    setCheckboxTree(makeCheckboxTree(categories));
    setSelectedCategoriesTotalProducts(
      calculateTotalAvailableProducts(categories)
    );
  }, [calculateTotalAvailableProducts, categories, makeCheckboxTree]);

  return (
    <Flex
      style={{
        position: "relative",
        height: "100vh",
      }}
      padding="spacingM"
      flexDirection="column"
      alignItems="baseline"
    >
      {!withCategorySelector ? (
        <FormControl
          style={{
            display: "flex",
            alignItems: "center",
            columnGap: "1em",
            position: "relative",
          }}
        >
          <FormControl.Label marginBottom="none">Search by</FormControl.Label>
          <TextInput
            style={{ width: "20em" }}
            placeholder="Search"
            value={searchValue}
            onChange={(event) => handleSearchBoxChange(event.target.value)}
          />
          {productsLoading && (
            <LoadingIcon
              style={{ position: "absolute", right: "0.5rem", zIndex: 1 }}
            />
          )}
        </FormControl>
      ) : (
        <></>
      )}
      <Grid
        columns={withCategorySelector ? "25% 75%" : "75% 25%"}
        style={{ width: "100%", height: "90%" }}
      >
        {withCategorySelector ? (
          <GridItem style={{ overflowY: "auto", position: "relative" }}>
            {categoriesLoading ? (
              <LoadingIcon
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ) : (
              <CheckboxTree
                checkboxes={checkboxTree}
                onCheckboxClick={handleCategoryCheckboxSelect}
                onLabelClick={handleCategorySelect}
                placeholder="No available categories"
              />
            )}
          </GridItem>
        ) : (
          <></>
        )}
        <GridItem
          style={{ overflowY: "scroll" }}
          paddingRight="spacingS"
          ref={productsGridRef}
          onScroll={() => handleProductsGridScroll()}
        >
          <CardGrid
            cards={products.map(
              ({
                canBeClicked,
                brand: title,
                title: subtitle,
                image,
                selected,
                sku,
                price,
              }) => ({
                canBeClicked,
                title,
                subtitle,
                image: {
                  src: image,
                  alt: "",
                },
                selected,
                sku,
                price,
              })
            )}
            onCardClick={(sku: string, isSelected: boolean) =>
              onProductSelect(sku, isSelected)
            }
            placeholder="No available product(s)"
            loading={productsLoading}
          />
        </GridItem>
        {!withCategorySelector ? (
          <GridItem
            style={{ overflowY: "auto", maxHeight: "85%" }}
            marginRight="spacingS"
          >
            <ProductBasket
              products={selectedProducts}
              onRemoveItem={(sku: string) => onProductSelect(sku, true)}
            />
          </GridItem>
        ) : (
          <></>
        )}
      </Grid>
      <Stack style={{ position: "absolute", right: "1em", bottom: "1em" }}>
        {withCategorySelector ? (
          <Text>{`${
            selectedCategoriesTotalProducts - excludedProductsCount
          }/${selectedCategoriesTotalProducts} selected`}</Text>
        ) : (
          ""
        )}
        <Button
          variant="primary"
          isDisabled={
            selectedProducts.length === 0 &&
            categories.every(({ selected }) => !selected)
          }
          onClick={onSaveSubmit}
        >
          Save
        </Button>
      </Stack>
      <Stack
        style={{ maxWidth: "75%" }}
        flexDirection="column"
        alignItems="baseline"
        spacing="spacingXs"
      >
        {errors.map((error) => (
          <Note variant="negative">{error}</Note>
        ))}
      </Stack>
    </Flex>
  );
};

export default Dialog;
