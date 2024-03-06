import React, { useCallback, useEffect, useState } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import DialogContainer from "../containers/Dialog";
import { CategoryJson } from "../types/CategoryJson";
import { FieldJson } from "../types/FieldJson";

interface SubCategoryBranch {
  id: string;
  subCategories: Array<SubCategoryBranch>;
}

interface InvocationParameters {
  context: string;
  data: FieldJson;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  const [data, setData] = useState<Omit<FieldJson, "type">>({
    products: [],
    categories: [],
    channel: "",
    application: "",
  });
  const [context, setContext] = useState("");

  const handleOnSaveSubmit = useCallback(() => {
    sdk.close({ data });
  }, [data, sdk]);

  const updateCategories = useCallback(
    ({
      productId,
      searchId,
      categoryPath,
      nestedArray,
      subCategoryTree,
    }: {
      productId?: string;
      searchId: string;
      categoryPath: Array<string>;
      nestedArray: Array<CategoryJson>;
      subCategoryTree?: Array<SubCategoryBranch>;
    }) => {
      const createSubCategoryBranch = ({
        id,
        subCategories,
      }: SubCategoryBranch): CategoryJson => ({
        category_id: id,
        subcategories: subCategories.map((subCategory) =>
          createSubCategoryBranch(subCategory)
        ),
      });

      const copyCategoryPath = [...categoryPath];
      if (copyCategoryPath[copyCategoryPath.length - 1] === searchId) {
        copyCategoryPath.pop();
      }
      const updatedArray = [...nestedArray];
      let currentArray = updatedArray;
      for (const pathId of copyCategoryPath) {
        const foundIndex = currentArray.findIndex(
          ({ category_id: id }) => id === pathId
        );

        if (foundIndex === -1) {
          const newCategory = {
            category_id: pathId,
            subcategories: [],
            excluded_products: [],
          };
          currentArray.push(newCategory);
          currentArray = newCategory.subcategories;
        } else {
          currentArray = currentArray[foundIndex].subcategories;
        }
      }

      const exists = currentArray.some(
        ({ category_id: id }) => id === searchId
      );

      if (exists) {
        const searchIndex = currentArray.findIndex(
          ({ category_id: id }) => id === searchId
        );
        if (searchIndex > -1) {
          if (productId) {
            const productIndex =
              currentArray[searchIndex].excluded_products?.indexOf(productId);
            if (productIndex !== undefined && productIndex > -1) {
              currentArray[searchIndex].excluded_products?.splice(
                productIndex,
                1
              );
            } else {
              currentArray[searchIndex].excluded_products?.push(productId);
            }
          } else {
            currentArray.splice(searchIndex, 1);

            if (currentArray.length === 0 && copyCategoryPath.length) {
              return updateCategories({
                searchId: copyCategoryPath[copyCategoryPath.length - 1],
                nestedArray,
                categoryPath: copyCategoryPath,
              });
            }
          }
        }
      } else {
        currentArray.push({
          category_id: searchId,
          subcategories:
            subCategoryTree?.map((subCategoryBranch) =>
              createSubCategoryBranch(subCategoryBranch)
            ) ?? [],
          excluded_products: [],
        });
      }
      return updatedArray;
    },
    []
  );

  const handleOnProductSelect = useCallback(
    (
      sku: string,
      selected: boolean,
      categoryId?: string,
      categoryPath?: Array<string>
    ) => {
      if (categoryId && categoryPath) {
        setData((prevData) => ({
          ...prevData,
          categories: updateCategories({
            searchId: categoryId,
            categoryPath,
            nestedArray: data.categories,
            productId: sku,
          }),
        }));
      } else {
        setData((prevData) => ({
          ...prevData,
          products: selected
            ? prevData.products.filter((productSku) => productSku !== sku)
            : [...prevData.products, sku],
        }));
      }
    },
    [data.categories, updateCategories]
  );

  const handleCategorySelect = useCallback(
    (
      id: string,
      categoryPath: Array<string>,
      subCategoryTree: Array<SubCategoryBranch>
    ) => {
      setData((prevData) => ({
        ...prevData,
        categories: updateCategories({
          searchId: id,
          categoryPath,
          nestedArray: prevData.categories,
          subCategoryTree,
        }),
      }));
    },
    [updateCategories]
  );

  useEffect(() => {
    const { data, context } = sdk.parameters
      .invocation as unknown as InvocationParameters;
    setData(data);
    setContext(context);
  }, [sdk.parameters]);

  return (
    <DialogContainer
      apiBase={sdk.parameters.installation.apiBase}
      imageBase={sdk.parameters.installation.imageBase}
      categoryBlueprint={sdk.parameters.installation.categoryMapper}
      productBlueprint={sdk.parameters.installation.productMapper}
      productCategoryBlueprint={
        sdk.parameters.installation.productCategoryPathMapper
      }
      context={context}
      selectedProductSkus={data.products}
      selectedCategories={data.categories}
      onSaveSubmit={handleOnSaveSubmit}
      onProductSelect={handleOnProductSelect}
      onCategorySelect={handleCategorySelect}
      channel={data.channel}
      application={data.application}
    />
  );
};

export default Dialog;
