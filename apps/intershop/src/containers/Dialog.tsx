import React, { useCallback, useEffect, useState } from "react";
import DialogComponent from "../components/Dialog";
import { Product } from "../types/Product";
import { Category } from "../types/Category";
import { CategoryJson } from "../types/CategoryJson";
import { MappedProductJson } from "../types/MappedProductJson";
import jsonMapper from "../utils/JsonMapper";
import { Blueprint } from "../types/Blueprint";
import { replaceChannelAndApplication } from "../utils/replace";

interface SearchableCategoryJson extends CategoryJson {
  [key: string]:
    | string
    | boolean
    | Array<string>
    | Array<CategoryJson>
    | undefined;
}

interface CategoryMetaData {
  categoryPath: Array<string>;
  subCategories: Array<string>;
}

interface CategoriesMetaData {
  [key: string]: CategoryMetaData;
}

interface ProductCategory {
  id: string;
  categoryPath: Array<string>;
}

interface ProductsCategory {
  [key: string]: ProductCategory;
}

interface CategoryExcludedProducts {
  [key: string]: Array<string>;
}

interface Errors {
  category: Array<string>;
  product: Array<string>;
}

interface Props {
  apiBase: string;
  application: string;
  channel: string;
  context: string;
  imageBase: string;
  categoryBlueprint: Blueprint;
  productBlueprint: Blueprint;
  productCategoryBlueprint: Blueprint;
  selectedProductSkus: Array<string>;
  selectedCategories: Array<CategoryJson>;
  onSaveSubmit: () => void;
  onCategorySelect: (
    id: string,
    categoryPath: Array<string>,
    subCategoryTree: Array<any>
  ) => void;
  onProductSelect: (
    sku: string,
    selected: boolean,
    categoryId?: string,
    categoryPath?: Array<string>
  ) => void;
}

const Dialog = ({
  apiBase,
  imageBase,
  categoryBlueprint,
  productBlueprint,
  productCategoryBlueprint,
  context,
  selectedProductSkus,
  selectedCategories,
  onSaveSubmit,
  onCategorySelect,
  onProductSelect,
  channel,
  application,
}: Props) => {
  const [lastCategoryFilterId, setLastCategoryFilterId] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedCategoryIdsInitialized, setSelectedCategoryIdsInitialized] =
    useState(false);
  const [categoriesInitialized, setCategoriesInitialized] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [moreProductsAvailable, setMoreProductsAvailable] = useState(false);
  const [errors, setErrors] = useState<Errors>({ category: [], product: [] });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Array<string>>(
    []
  );
  const [excludedCategoryProductSkus, setExcludedCategoryProductSkus] =
    useState<CategoryExcludedProducts>({});
  const [excludedProductSkus, setExcludedProductSkus] = useState<Array<string>>(
    []
  );
  const [products, setProducts] = useState<Array<Product>>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<Product>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [categoriesMetaDeta, setCategoriesMetaData] =
    useState<CategoriesMetaData>({});
  const [productsCategory, setProductsCategory] = useState<ProductsCategory>(
    {}
  );

  const getSelectedCategoriesKey = useCallback(
    <T extends boolean | string | Array<string> | Array<CategoryJson>>(
      key: string,
      categories: Array<SearchableCategoryJson>
    ): T[] =>
      categories.reduce<Array<T>>((acc, category) => {
        acc.push(category[key] as T);
        acc.push(
          ...getSelectedCategoriesKey<T>(
            key,
            category.subcategories as Array<SearchableCategoryJson>
          )
        );
        return acc;
      }, []),
    []
  );

  const mapCategories = useCallback(
    (categoriesToMap: Array<any>): Array<Category> =>
      categoriesToMap.map(({ totalProducts, subCategories, ...category }) => {
        const mappedSubCategories = subCategories?.map((subCategory: any) =>
          jsonMapper(categoryBlueprint, subCategory)
        );
        setCategoriesMetaData((prev) => {
          prev[category.id] = {
            categoryPath: category.categoryPath,
            subCategories: mappedSubCategories?.map(({ id }: any) => id) ?? [],
          };
          return prev;
        });
        return {
          ...category,
          totalProducts: totalProducts ?? 0,
          selected: selectedCategoryIds.includes(category.id),
          subCategories: mappedSubCategories
            ? mapCategories(mappedSubCategories)
            : [],
        };
      }),
    [categoryBlueprint, selectedCategoryIds]
  );

  const mapProducts = useCallback(
    (productsToMap: Array<MappedProductJson>) =>
      productsToMap.map((product) => {
        const { price, image } = product;

        return {
          ...product,
          image: `${imageBase}${image}`,
          price: `$${price}`,
        };
      }),
    [imageBase]
  );

  const fetchCategories = useCallback(
    () =>
      fetch(
        replaceChannelAndApplication(
          `${apiBase}/categories?imageView=NO-IMAGE&view=tree&limit=10`,
          { channel, application }
        )
      )
        .then((res) => {
          if (res.status === 404) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then(({ elements }: any) =>
          elements.map((element: any) => jsonMapper(categoryBlueprint, element))
        ),
    [apiBase, application, categoryBlueprint, channel]
  );

  const fetchProducts = useCallback(
    ({
      amount,
      categoryPath,
      offset,
      searchTerm = "",
      skus,
    }: {
      amount?: number;
      categoryPath?: string;
      offset?: number;
      searchTerm?: string;
      skus?: string;
    }) =>
      fetch(
        replaceChannelAndApplication(
          `${apiBase}${
            categoryPath ? `/categories/${categoryPath}` : ""
          }/products?${amount ? `amount=${amount}` : ""}&${
            offset ? `offset=${offset}` : ""
          }&${
            skus ? `SKU=${skus}` : ""
          }&searchTerm=${searchTerm}&attrs=sku,manufacturer,image,defaultCategory,listPrice`,
          { channel, application }
        )
      )
        .then((res) => {
          if (res.status === 404) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then((json) => ({
          total: json.total ?? 0,
          elements: json.elements.map((element: any) =>
            jsonMapper(productBlueprint, element)
          ),
        }))
        .catch((error) => {
          setErrors((prevErrors) => ({
            ...prevErrors,
            product: [
              ...prevErrors.product,
              `An error occurred while fetching products (${error})`,
            ],
          }));
          setProductsLoading(false);
        }),
    [apiBase, application, channel, productBlueprint]
  );

  const loadCategories = useCallback(() => {
    setCategoriesLoading(true);
    fetchCategories()
      .then((mappedJsonCategories) => {
        setCategories(mapCategories(mappedJsonCategories));
        setCategoriesLoading(false);
      })
      .catch((error) => {
        setErrors((prevErrors) => ({
          ...prevErrors,
          category: [
            ...prevErrors.category,
            `An error occurred while fetching categories (${error})`,
          ],
        }));
        setCategoriesLoading(false);
        setCategories([]);
      });
  }, [fetchCategories, mapCategories]);

  const loadProducts = useCallback(
    ({
      amount = 20,
      offset = 0,
      categoryId,
      searchTerm = "",
    }: {
      amount?: number;
      offset?: number;
      categoryId?: string;
      searchTerm?: string;
    }) => {
      if (offset === 0) {
        setProducts([]);
      }
      setProductsLoading(true);
      const categoryPath =
        categoryId && categoriesMetaDeta[categoryId].categoryPath
          ? categoriesMetaDeta[categoryId].categoryPath.join("/")
          : "";
      fetchProducts({ amount, categoryPath, offset, searchTerm })
        .then(({ total, elements }: any) => {
          setMoreProductsAvailable(total > 0 ? amount + offset < total : false);
          return elements;
        })
        .then((mappedJsonProducts: Array<MappedProductJson>) => {
          const productsCategoryMap: ProductsCategory =
            mappedJsonProducts.reduce<ProductsCategory>(
              (acc, { defaultCategory, sku }) => {
                acc[sku] = jsonMapper(
                  productCategoryBlueprint,
                  defaultCategory
                );
                return acc;
              },
              {}
            );
          const newProducts = mapProducts(mappedJsonProducts);

          setProductsCategory((prevProductsCategory) =>
            offset === 0
              ? productsCategoryMap
              : { ...prevProductsCategory, ...productsCategoryMap }
          );
          setProducts((prevProducts) =>
            offset === 0 ? newProducts : [...prevProducts, ...newProducts]
          );
          setProductsLoading(false);
        })
        .catch((error) => {
          return setProducts([]);
        });
    },
    [categoriesMetaDeta, fetchProducts, mapProducts, productCategoryBlueprint]
  );

  const handleToggleProduct = useCallback(
    (sku: string, selected: boolean) => {
      if (context === "category") {
        const categoryPath =
          categoriesMetaDeta[lastCategoryFilterId].categoryPath;
        const rootCategory = categoryPath.length
          ? categoryPath[0]
          : lastCategoryFilterId;
        onProductSelect(sku, selected, rootCategory, []);
      } else {
        onProductSelect(sku, selected);
      }
    },
    [categoriesMetaDeta, context, lastCategoryFilterId, onProductSelect]
  );

  const handleRequestProducts = useCallback(
    ({
      categoryId,
      searchTerm,
      offset,
    }: {
      categoryId?: string;
      searchTerm?: string;
      offset?: number;
    }) => {
      setErrors((prevErrors) => ({ ...prevErrors, product: [] }));
      if (categoryId && categoryId !== "") {
        setLastCategoryFilterId(categoryId);
      }
      if (offset === 0 || moreProductsAvailable) {
        loadProducts({ categoryId, searchTerm, offset });
      }
    },
    [loadProducts, moreProductsAvailable]
  );

  const handleCategorySelect = useCallback(
    (id: string) => {
      const makeSubCategoryTree = (id: string): any => {
        const { subCategories } = categoriesMetaDeta[id];
        return {
          id,
          subCategories: subCategories.map((subCategoryId) =>
            makeSubCategoryTree(subCategoryId)
          ),
        };
      };

      const { categoryPath, subCategories } = categoriesMetaDeta[id];
      onCategorySelect(
        id,
        categoryPath,
        subCategories.map((subCategoryId) => makeSubCategoryTree(subCategoryId))
      );
    },
    [categoriesMetaDeta, onCategorySelect]
  );

  const initializeSelectedProducts = useCallback(() => {
    if (selectedProductSkus.length) {
      fetchProducts({ skus: selectedProductSkus.join("_or_") })
        .then(({ elements }: any) => mapProducts(elements))
        .then((selectedProducts) => setSelectedProducts(selectedProducts))
        .catch(() => setProducts([]));
    }
  }, [fetchProducts, mapProducts, selectedProductSkus]);

  const updateSelectedProducts = useCallback(() => {
    setSelectedProducts((prevSelectedProducts) => {
      if (prevSelectedProducts.length < selectedProductSkus.length) {
        const uniqueSku = selectedProductSkus.find(
          (sku) =>
            prevSelectedProducts.map(({ sku }) => sku).indexOf(sku) === -1
        );
        const selectedProduct = products.find(({ sku }) => sku === uniqueSku);
        if (selectedProduct) {
          return [
            ...prevSelectedProducts,
            {
              ...selectedProduct,
              selected: true,
            },
          ];
        }
        return prevSelectedProducts;
      } else {
        const uniqueSku = prevSelectedProducts
          .map(({ sku }) => sku)
          .find((sku) => selectedProductSkus.indexOf(sku) === -1);
        return prevSelectedProducts.filter(({ sku }) => sku !== uniqueSku);
      }
    });
  }, [products, selectedProductSkus]);

  useEffect(() => {
    updateSelectedProducts();
  }, [updateSelectedProducts]);

  useEffect(() => {
    const mapCategoryExcludedProducts = (categories: Array<CategoryJson>) =>
      categories.reduce<CategoryExcludedProducts>(
        (acc, { category_id: id, excluded_products: excludedProducts }) => {
          if (excludedProducts) {
            acc[id] = excludedProducts;
          }
          return acc;
        },
        {}
      );

    setSelectedCategoryIds(
      getSelectedCategoriesKey<string>(
        "category_id",
        selectedCategories as Array<SearchableCategoryJson>
      )
    );
    const excludedProducts = getSelectedCategoriesKey<Array<string>>(
      "excluded_products",
      selectedCategories as Array<SearchableCategoryJson>
    ).reduce(
      (acc, excludedProducts) => [...acc, ...(excludedProducts ?? [])],
      []
    );
    setExcludedProductSkus(excludedProducts);
    setExcludedCategoryProductSkus(
      mapCategoryExcludedProducts(selectedCategories)
    );
  }, [getSelectedCategoriesKey, selectedCategories]);

  useEffect(() => {
    if (initialLoad && apiBase && context) {
      if (context === "category") {
        setSelectedCategoryIds(
          getSelectedCategoriesKey<string>(
            "category_id",
            selectedCategories as Array<SearchableCategoryJson>
          )
        );
        setSelectedCategoryIdsInitialized(true);
      } else {
        initializeSelectedProducts();
        loadProducts({});
      }
      setInitialLoad(false);
    }
  }, [
    apiBase,
    context,
    getSelectedCategoriesKey,
    initialLoad,
    initializeSelectedProducts,
    loadCategories,
    loadProducts,
    selectedCategories,
  ]);

  useEffect(() => {
    if (selectedCategoryIdsInitialized && !categoriesInitialized) {
      loadCategories();
      loadProducts({});
      setCategoriesInitialized(true);
    }
  }, [
    categoriesInitialized,
    loadCategories,
    loadProducts,
    selectedCategoryIdsInitialized,
  ]);

  useEffect(() => {
    const updateCategory = ({
      subCategories,
      ...category
    }: Category): Category => ({
      ...category,
      selected: selectedCategoryIds.includes(category.id),
      subCategories: subCategories.map((subCategory) =>
        updateCategory(subCategory)
      ),
    });

    const updateProduct = (product: Product): Product => {
      const categoryPath =
        categoriesMetaDeta[lastCategoryFilterId]?.categoryPath;
      return {
        ...product,
        canBeClicked:
          context === "category"
            ? lastCategoryFilterId !== "" &&
              selectedCategoryIds.includes(lastCategoryFilterId)
            : true,
        selected:
          context === "category"
            ? lastCategoryFilterId === ""
              ? selectedCategoryIds.includes(
                  productsCategory[product.sku].id
                ) && !excludedProductSkus.includes(product.sku)
              : selectedCategoryIds.includes(lastCategoryFilterId) &&
                !excludedCategoryProductSkus[
                  categoryPath.length ? categoryPath[0] : lastCategoryFilterId
                ]?.includes(product.sku)
            : selectedProductSkus.includes(product.sku),
      };
    };
    setCategories((prevCategories) =>
      prevCategories.map((category) => updateCategory(category))
    );
    setProducts((prevProducts) =>
      prevProducts.map((product) => updateProduct(product))
    );
  }, [
    categoriesMetaDeta,
    context,
    excludedCategoryProductSkus,
    excludedProductSkus,
    lastCategoryFilterId,
    productsCategory,
    selectedCategoryIds,
    selectedProductSkus,
  ]);

  return (
    <DialogComponent
      excludedProductsCount={excludedProductSkus.length}
      categoriesLoading={categoriesLoading}
      productsLoading={productsLoading}
      withCategorySelector={context === "category"}
      categories={categories}
      products={products}
      selectedProducts={selectedProducts}
      onSaveSubmit={onSaveSubmit}
      onProductSelect={handleToggleProduct}
      onCategorySelect={handleCategorySelect}
      onRequestProducts={handleRequestProducts}
      errors={[...errors.category, ...errors.product]}
    />
  );
};

export default Dialog;
