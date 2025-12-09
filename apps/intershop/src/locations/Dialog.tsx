import React, { useCallback, useEffect, useState } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import DialogContainer from "../containers/Dialog";
import { FieldJson } from "../types/FieldJson";

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
    (categoryId: string, currentCategories: Array<string>): Array<string> => {
      // Simple toggle: if category exists, remove it; otherwise, add it
      const exists = currentCategories.includes(categoryId);
      
      if (exists) {
        return currentCategories.filter(id => id !== categoryId);
      } else {
        return [...currentCategories, categoryId];
      }
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
      // For product selection (not category-based), just toggle the product
      setData((prevData) => ({
        ...prevData,
        products: selected
          ? prevData.products.filter((productSku) => productSku !== sku)
          : [...prevData.products, sku],
      }));
    },
    []
  );

  const handleCategorySelect = useCallback(
    (
      id: string,
      categoryPath: Array<string>,
      //subCategoryTree: Array<SubCategoryBranch>
    ) => {
      setData((prevData) => ({
        ...prevData,
        categories: updateCategories(id, prevData.categories),
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
      imageType={sdk.parameters.installation.imageType}
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
