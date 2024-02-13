import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ButtonGroup,
  Button,
  Stack,
  Text,
  TextLink,
  Select,
  Flex,
  FormControl,
  Note,
  Paragraph,
  Box,
  Popover,
} from "@contentful/f36-components";
import { FieldAppSDK, init } from "@contentful/app-sdk";
import { DeleteIcon } from "@contentful/f36-icons";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";
import ProductCard from "../components/ProductCard";
import { FieldJson } from "../types/FieldJson";
import { Product } from "../types/Product";
import { Category } from "../types/Category";
import { CategoryJson } from "../types/CategoryJson";
import jsonMapper from "../utils/JsonMapper";
import { MappedProductJson } from "../types/MappedProductJson";
import { Blueprint } from "../types/Blueprint";
import CategoryCard from "../components/CategoryCard";
import CategoryCardType from "../types/CategoryCard";
import LoadingIcon from "../components/LoadingIcon";
import { replaceChannelAndApplication } from "../utils/replace";
import FetchFilters from "../types/FetchFilters";

interface Popovers
  extends Record<"deleteSelection" | "changeChannelOrApplication", boolean> {}

interface Errors {
  categories: Array<string>;
  products: Array<string>;
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  const [initialLoad, setInitialLoad] = useState(true);
  const [jsonContainsData, setJsonContainsData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayPopovers, setDisplayPopovers] = useState<Popovers>({
    deleteSelection: false,
    changeChannelOrApplication: false,
  });
  const [displayChannelSelector, setDisplayChannelSelector] = useState(false);
  const [application, setApplication] = useState("");
  const [channel, setChannel] = useState("");
  const [selectedApplication, setSelectedApplication] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [categoryTotalExcludedProducts, setCategoryTotalExcludedProducts] =
    useState<{ [key: string]: number }>({});
  const [categoriesData, setCategoriesData] = useState<Array<Category>>([]);
  const [products, setProducts] = useState<Array<Product>>([]);
  const [categories, setCategories] = useState<
    Array<ReactElement<CategoryCardType>>
  >([]);
  const [errors, setErrors] = useState<Errors>({
    products: [],
    categories: [],
  });
  const channels: Array<string> = sdk.parameters.installation?.channels ?? [];
  const applications: Array<string> =
    sdk.parameters.installation?.applications ?? [];

  const mapCategories = useCallback(
    (
      categoriesToMap: Array<any>,
      filter: Array<string>,
      categoryBlueprint: Blueprint
    ): Array<Category> =>
      categoriesToMap
        .filter(({ id }) => filter.includes(id))
        .map(({ subCategories, ...category }) => ({
          ...category,
          subCategories: subCategories?.length
            ? mapCategories(
                subCategories.map((subCategory: any) =>
                  jsonMapper(categoryBlueprint, subCategory)
                ),
                filter,
                categoryBlueprint
              )
            : [],
        })),
    []
  );

  const groupCategories = useCallback(
    (categories: Array<CategoryJson>) =>
      categories.reduce<{ [key: string]: number }>(
        (
          acc,
          { category_id: id, subcategories, excluded_products }: CategoryJson
        ) => {
          acc = {
            ...acc,
            [id]: excluded_products ? excluded_products.length : 0,
            ...groupCategories(subcategories),
          };
          return acc;
        },
        {}
      ),
    []
  );

  const loadProducts = useCallback(
    (skus: string, { ...filters }: FetchFilters) => {
      setLoading(true);
      const { apiBase, productMapper, imageBase } = sdk.parameters.installation;
      fetch(
        replaceChannelAndApplication(
          `${apiBase}/products?SKU=${skus}&attrs=sku,manufacturer,image,defaultCategory,listPrice`,
          { ...filters }
        )
      )
        .then((res) => {
          if (res.status === 404) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then((json) =>
          json.elements.map((element: any) =>
            jsonMapper(productMapper, element)
          )
        )
        .then((mappedJsonElements: Array<MappedProductJson>) =>
          setProducts(
            mappedJsonElements.map(({ image, price, ...product }) => ({
              ...product,
              image: `${imageBase}${image}`,
              price: `$${price}`,
            }))
          )
        )
        .then(() => setLoading(false))
        .catch((error) => {
          setErrors((prevErrors) => ({
            ...prevErrors,
            products: [
              ...prevErrors.products,
              `An error occurred while fetching products (${error})`,
            ],
          }));
          setProducts([]);
          setLoading(false);
        });
    },
    [sdk.parameters.installation]
  );

  const removeCategoryFromField = useCallback(
    (
      id: string,
      nestedArray: Array<CategoryJson>,
      categoryPath: Array<string>
    ) => {
      const copyCategoryPath = [...categoryPath];
      if (copyCategoryPath[copyCategoryPath.length - 1] === id) {
        copyCategoryPath.pop();
      }
      const updatedArray = [...nestedArray];
      let currentArray = updatedArray;

      for (const pathId of copyCategoryPath) {
        const foundIndex = currentArray.findIndex(
          ({ category_id: categoryId }) => categoryId === pathId
        );

        if (foundIndex === -1) {
          return updatedArray;
        } else {
          currentArray = currentArray[foundIndex].subcategories;
        }
      }

      const exists = currentArray.some(
        ({ category_id: categoryId }) => categoryId === id
      );

      if (exists) {
        const searchIndex = currentArray.findIndex(
          ({ category_id: categoryId }) => categoryId === id
        );
        if (searchIndex > -1) {
          currentArray.splice(searchIndex, 1);

          if (currentArray.length === 0 && copyCategoryPath.length) {
            return removeCategoryFromField(
              copyCategoryPath[copyCategoryPath.length - 1],
              nestedArray,
              copyCategoryPath
            );
          }
        }
      }
      return updatedArray;
    },
    []
  );

  const resetField = useCallback(() => {
    const { ...data } = sdk.field.getValue();
    sdk.field.setValue({
      ...data,
      categories: [],
      products: [],
      type: "",
    });
    setProducts([]);
    setCategories([]);
    setErrors({ categories: [], products: [] });
    setJsonContainsData(false);
  }, [sdk.field]);

  const handleOnCloseCategory = useCallback(
    (id: string, categoryPath: Array<string>) => {
      const { categories, ...data } = sdk.field.getValue();
      const updatedCategories = removeCategoryFromField(
        id,
        categories,
        categoryPath
      );
      sdk.field.setValue({
        ...data,
        categories: updatedCategories,
        ...(updatedCategories.length ? {} : { type: "" }),
      });
      setCategories((prevCategories) =>
        prevCategories.filter((component) => component.key !== id)
      );
      setJsonContainsData(updatedCategories.length > 0);
    },
    [removeCategoryFromField, sdk.field]
  );

  const handleOnCloseProduct = useCallback(
    (sku: string) => {
      const { products: currentProducts, ...data } =
        sdk.field.getValue() as FieldJson;
      const remainingProducts = currentProducts.filter(
        (productSku) => productSku !== sku
      );
      sdk.field.setValue({
        ...data,
        products: remainingProducts,
        ...(remainingProducts.length ? {} : { type: "" }),
      });
      setProducts((prevProducts) =>
        prevProducts.filter(({ sku: productSku }) => productSku !== sku)
      );
      setJsonContainsData(remainingProducts.length > 0);
    },
    [sdk.field]
  );

  const renderCategories = useCallback(
    (
      categories: Array<Category>,
      ancestorCategories: string = "",
      ancestorCategoriesIds: Array<string> = []
    ): Array<ReactElement<CategoryCardType>> =>
      categories
        .map(({ title, subCategories, id, totalProducts, image }: Category) =>
          subCategories?.length ? (
            renderCategories(
              subCategories,
              `${
                ancestorCategories ? `${ancestorCategories} - ${title} ` : title
              }`,
              [...ancestorCategoriesIds, id]
            )
          ) : (
            <CategoryCard
              key={id}
              thumbnailSrc={
                image ? `${sdk.parameters.installation.imageBase}${image}` : ""
              }
              title={`${
                ancestorCategories ? `${ancestorCategories} - ` : ""
              } ${title}`}
              onClose={() => handleOnCloseCategory(id, ancestorCategoriesIds)}
            />
          )
        )
        .flat(),
    [handleOnCloseCategory, sdk.parameters.installation.imageBase]
  );

  const loadCategories = useCallback(
    (filter: Array<string>, { ...filters }: FetchFilters) => {
      setLoading(true);
      const { apiBase, categoryMapper } = sdk.parameters.installation;
      fetch(
        replaceChannelAndApplication(
          `${apiBase}/categories?view=tree&limit=10`,
          { ...filters }
        )
      )
        .then((res) => {
          if (res.status === 404) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then(({ elements }: any) =>
          elements.map((element: any) => jsonMapper(categoryMapper, element))
        )
        .then((mappedJsonElements) =>
          mapCategories(mappedJsonElements, filter, categoryMapper)
        )
        .then((categories) => setCategoriesData(categories))
        .then(() => setLoading(false))
        .catch((error) => {
          setErrors((prevErrors) => ({
            ...prevErrors,
            category: [
              ...prevErrors.categories,
              `An error occurred while fetching categories (${error})`,
            ],
          }));
          setCategories([]);
          return setLoading(false);
        });
    },
    [mapCategories, sdk.parameters.installation]
  );

  const loadData = useCallback(
    (
      products: Array<string>,
      categories: Array<CategoryJson>,
      { ...filters }: FetchFilters
    ) => {
      setErrors({ products: [], categories: [] });
      if (products.length) {
        loadProducts(products.join("_or_"), { ...filters });
      } else if (categories.length) {
        const categoriesMetadata = groupCategories(categories);
        setCategoryTotalExcludedProducts(categoriesMetadata);
        loadCategories(Object.keys(categoriesMetadata), { ...filters });
      }
    },
    [groupCategories, loadCategories, loadProducts]
  );

  const openDialogue = useCallback(
    (context?: string) =>
      sdk.dialogs
        .openCurrentApp({
          title: "Select product",
          shouldCloseOnEscapePress: true,
          shouldCloseOnOverlayClick: true,
          width: "fullWidth",
          minHeight: "calc(100vh - 20em)",
          parameters: {
            instance: sdk.parameters.instance,
            data: sdk.field.getValue(),
            context: context ?? "",
          },
        })
        .then((params) => {
          if (params?.data) {
            const { products, categories, channel, application } =
              params.data as FieldJson;
            sdk.field.setValue({
              type: products.length
                ? "products"
                : categories.length
                ? "categories"
                : "",
              products,
              categories,
              channel,
              application,
            });
            setJsonContainsData(
              products.length || categories.length ? true : false
            );
            loadData(products, categories, { channel, application });
          }
        }),
    [loadData, sdk.dialogs, sdk.field, sdk.parameters.instance]
  );

  const updatePopOverDisplay = useCallback(
    (key: keyof Popovers, display: boolean) => {
      setDisplayPopovers((prevValue) => ({ ...prevValue, [key]: display }));
    },
    []
  );

  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => {
      sdk.window.stopAutoResizer();
    };
  }, [sdk.field, sdk.window]);

  useEffect(() => {
    if (categoriesData?.length && categoryTotalExcludedProducts) {
      setCategories(renderCategories(categoriesData));
    }
  }, [
    categoriesData,
    categoryTotalExcludedProducts,
    categoryTotalExcludedProducts.length,
    renderCategories,
  ]);

  init(() => {
    if (initialLoad) {
      if (!sdk.field.getValue()) {
        const channel = channels.length ? channels[0] : "";
        const application = applications.length ? applications[0] : "";
        sdk.field.setValue({
          channel,
          application,
          type: "",
          categories: [],
          products: [],
        });
        setChannel(channel);
        setApplication(application);
      } else {
        const { products, categories, type, channel, application } =
          sdk.field.getValue() as FieldJson;
        let filters = {
          channel,
          application,
        };
        if (channel) {
          if (!channels.length) {
            setSelectedChannel("");
          } else {
            setSelectedChannel(channel);
            setChannel(channel);
          }
        } else {
          setSelectedChannel("");
        }
        if (applications.length) {
          const newApplication = application ? application : applications[0];
          setSelectedApplication(newApplication);
          setApplication(newApplication);
          filters = { ...filters, application: newApplication };
        } else {
          setSelectedApplication("");
        }
        setJsonContainsData(type !== "");
        loadData(products, categories, { ...filters });
      }
      setInitialLoad(false);
    }
  });

  useEffect(() => {
    const { application, channel, products, categories, ...data } =
      sdk.field.getValue();
    if (
      (((selectedChannel === "" && !channels.length) ||
        (selectedChannel !== "" && channels.length)) &&
        channel !== selectedChannel) ||
      (((selectedApplication === "" && !applications.length) ||
        (selectedApplication !== "" && applications.length)) &&
        application !== selectedApplication)
    ) {
      sdk.field.setValue({
        ...data,
        products,
        categories,
        channel: selectedChannel,
        application: selectedApplication,
      });

      loadData(products, categories, {
        channel: selectedChannel,
        application: selectedApplication,
      });
    }
  }, [
    applications.length,
    channels.length,
    groupCategories,
    loadCategories,
    loadData,
    loadProducts,
    sdk.field,
    selectedApplication,
    selectedChannel,
  ]);

  const renderPopover = (
    trigger: ReactNode,
    key: keyof Popovers,
    additionalConfirmAction?: () => void
  ) => (
    <Popover
      isOpen={displayPopovers[key]}
      onClose={() => updatePopOverDisplay(key, false)}
      offset={[1, 10]}
    >
      <Popover.Trigger>{trigger}</Popover.Trigger>
      <Popover.Content>
        <Stack padding="spacingM" alignItems="center">
          <Paragraph marginBottom="none">
            Selected products or categories will be deleted
          </Paragraph>
          <Button
            variant="primary"
            onClick={() => {
              resetField();
              updatePopOverDisplay(key, false);
              additionalConfirmAction && additionalConfirmAction();
            }}
          >
            Ok
          </Button>
        </Stack>
      </Popover.Content>
    </Popover>
  );

  if (
    (channels.length > 1 && !selectedChannel) ||
    (applications.length > 1 && !selectedChannel) ||
    displayChannelSelector
  ) {
    return (
      <>
        <Stack
          alignItems="center"
          justifyContent="space-between"
          flexDirection="row"
          marginTop="spacingM"
          spacing="spacing3Xl"
        >
          <Stack fullWidth>
            <FormControl style={{ width: "100%" }}>
              <FormControl.Label>Channel</FormControl.Label>
              <Select
                onChange={(event) => {
                  setChannel(event.target.value);
                }}
                value={channel}
                style={{ marginBottom: 0 }}
                isDisabled={channels.length < 2}
              >
                {channels.map((channel: string) => (
                  <Select.Option value={channel}>{channel}</Select.Option>
                ))}
              </Select>
            </FormControl>
            <FormControl style={{ width: "100%" }}>
              <FormControl.Label>Application</FormControl.Label>
              <Select
                onChange={(event) => {
                  setApplication(event.target.value);
                }}
                value={selectedApplication}
                isDisabled={applications.length < 2}
              >
                {applications.map((application: string) => (
                  <Select.Option value={application}>
                    {application}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="primary"
            onClick={() => {
              if (selectedChannel === "") {
                setSelectedChannel(channel ? channel : channels[0]);
              } else {
                setSelectedChannel(channel);
              }
              if (selectedApplication === "") {
                setSelectedApplication(
                  application ? application : applications[0]
                );
              } else {
                setSelectedApplication(application);
              }
              setDisplayChannelSelector(false);
            }}
          >
            Confirm
          </Button>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Stack
        spacing="spacingM"
        flexDirection="column"
        alignItems="baseline"
        marginTop="spacingM"
        style={{ border: "solid 1px transparent" }}
      >
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          fullWidth
          style={{ backgroundColor: "#F7F9FA" }}
          padding="spacingM"
        >
          <Flex flexDirection="column" alignItems="baseline">
            <Paragraph
              marginBottom="none"
              style={channels.length > 1 ? {} : { color: "darkgray" }}
            >
              <span style={{ fontWeight: "bold" }}>Channel: </span>
              {selectedChannel || "N/A"}
            </Paragraph>
            <Paragraph
              marginBottom="none"
              style={applications.length > 1 ? {} : { color: "darkgray" }}
            >
              <span style={{ fontWeight: "bold" }}>Application: </span>
              {selectedApplication || "N/A"}
            </Paragraph>
          </Flex>
          {renderPopover(
            <Button
              variant="secondary"
              onClick={() =>
                updatePopOverDisplay(
                  "changeChannelOrApplication",
                  !displayPopovers.changeChannelOrApplication
                )
              }
              isDisabled={channels.length < 2 && applications.length < 2}
            >
              Change Channel/Application
            </Button>,
            "changeChannelOrApplication",
            () => setDisplayChannelSelector(true)
          )}
        </Flex>
        <Box style={{ width: "100%" }}>
          {jsonContainsData ? (
            <Stack flexDirection="row" justifyContent="space-between" fullWidth>
              {renderPopover(
                <TextLink
                  icon={<DeleteIcon />}
                  variant="secondary"
                  onClick={() =>
                    updatePopOverDisplay(
                      "deleteSelection",
                      !displayPopovers.deleteSelection
                    )
                  }
                  style={{
                    transform: "scale(0.85)",
                    transformOrigin: "left",
                    textDecoration: "underline",
                  }}
                >
                  Delete selection
                </TextLink>,
                "deleteSelection"
              )}
              <Button
                variant="primary"
                onClick={() =>
                  openDialogue(
                    sdk.field.getValue().categories.length
                      ? "category"
                      : "products"
                  )
                }
              >
                Change selection
              </Button>
            </Stack>
          ) : (
            <ButtonGroup variant="spaced" spacing="spacingM">
              <Button
                variant="primary"
                onClick={() => openDialogue("products")}
              >
                Product(s)
              </Button>
              <Button
                variant="primary"
                onClick={() => openDialogue("category")}
                id="categoryProducts"
              >
                Category
              </Button>
            </ButtonGroup>
          )}
        </Box>

        {products.length || categories.length ? (
          <Stack
            flex="max-content"
            paddingBottom="spacingS"
            fullWidth
            style={{ overflowX: "auto" }}
          >
            {products.length ? (
              products.map(
                ({ brand: title, title: subtitle, image, price, sku }, i) => (
                  <ProductCard
                    key={i}
                    price={price}
                    title={title}
                    subtitle={subtitle}
                    identifier={sku}
                    image={{
                      src: image,
                      alt: "",
                    }}
                    onClose={() => {
                      handleOnCloseProduct(sku);
                    }}
                    aria="Remove product"
                    style={{ width: "20%", height: "16.5em", flexShrink: 0 }}
                  />
                )
              )
            ) : (
              <Stack
                flexDirection="column"
                spacing="spacingS"
                alignItems="baseline"
                style={{ width: "100%" }}
              >
                {categories.map((category) => category)}
              </Stack>
            )}
          </Stack>
        ) : loading ? (
          <LoadingIcon />
        ) : (
          <Text fontColor="gray500">No product(s) selected</Text>
        )}
      </Stack>
      <Stack
        style={{ maxWidth: "75%" }}
        flexDirection="column"
        alignItems="baseline"
        spacing="spacingXs"
      >
        {[...errors.categories, ...errors.products].map((error) => (
          <Note variant="negative">{error}</Note>
        ))}
      </Stack>
    </>
  );
};

export default Field;
