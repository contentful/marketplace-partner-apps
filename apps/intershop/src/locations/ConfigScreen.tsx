import React, { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Flex,
  Text,
  Subheading,
  Stack,
  Note,
  Pill,
  IconButton,
} from "@contentful/f36-components";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";
import { Blueprint } from "../types/Blueprint";
import FormInputField from "../components/FormInputField";
import { PlusCircleTrimmedIcon } from "@contentful/f36-icons";

export interface AppInstallationParameters {
  apiBase: string;
  imageBase?: string;
  applications: Array<string>;
  channels: Array<string>;
  categoryMapper: Blueprint;
  productMapper: Blueprint;
  productCategoryPathMapper: Blueprint;
  [key: string]: any;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiBase: "",
    applications: [],
    channels: [],
    categoryMapper: {
      id: "",
      title: "",
      categoryPath: "",
      subCategories: "",
      totalProducts: "",
      image: "",
    },
    productMapper: {
      sku: "",
      brand: "",
      image: "",
      price: "",
      title: "",
      defaultCategory: "",
    },
    productCategoryPathMapper: {
      id: "",
      categoryPath: "",
    },
  });
  const sdk = useSDK<ConfigAppSDK>();

  const [channelInputValue, setChannelInputValue] = useState("");
  const [applicationInputValue, setApplicationInputValue] = useState("");

  const [errors, setErrors] = useState({
    apiBase: "",
    applications: "",
    channels: "",
    categoryMapper: {
      id: "",
      title: "",
      categoryPath: "",
      subCategories: "",
      totalProducts: "",
      image: "",
    },
    productMapper: {
      sku: "",
      brand: "",
      image: "",
      price: "",
      title: "",
      defaultCategory: "",
    },
    productCategoryPathMapper: {
      id: "",
      categoryPath: "",
    },
    imageBase: "",
  });

  const [unvalidatedBlueprints, setUnvalidatedBlueprints] = useState<{
    [key: string]: Blueprint;
  }>({
    categoryMapper: {
      id: "",
      title: "",
      categoryPath: "",
      subCategories: "",
      totalProducts: "",
      image: "",
    },
    productCategoryPathMapper: {
      id: "",
      categoryPath: "",
    },
    productMapper: {
      sku: "",
      brand: "",
      image: "",
      price: "",
      title: "",
      defaultCategory: "",
    },
  });

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  const updateParameters = useCallback(
    <
      TKey extends keyof AppInstallationParameters,
      Tvalue extends AppInstallationParameters[TKey]
    >(
      key: TKey,
      value: Tvalue
    ) =>
      setParameters((prevParameters) => ({ ...prevParameters, [key]: value })),
    []
  );

  const updateObject = useCallback(
    (objectParameterKey: string, key: string, value: string) =>
      setUnvalidatedBlueprints((prevUnvalidatedBluePrints) => {
        const blueprintToUpdate = {
          ...prevUnvalidatedBluePrints[objectParameterKey],
        };
        return {
          ...prevUnvalidatedBluePrints,
          [objectParameterKey]: {
            ...blueprintToUpdate,
            [key]: value,
          },
        };
      }),
    []
  );

  const validateObjectParameter = useCallback((objectToValidate: any) => {
    const result: any = {};

    for (const key in objectToValidate) {
      if (objectToValidate.hasOwnProperty(key)) {
        const value = objectToValidate[key];
        let error = "";

        if (!value || value === "") {
          error = "Please input a value";
        }

        result[key] = error;
      }
    }

    return result;
  }, []);

  const handleAddArrayElement = useCallback(
    <
      TKey extends keyof Pick<
        AppInstallationParameters,
        "channels" | "applications"
      >,
      TValue extends AppInstallationParameters[TKey][number]
    >(
      key: TKey,
      value: TValue
    ) => {
      const currentArray = parameters[key] ?? [];
      if (!currentArray.includes(value)) {
        updateParameters(key, [...currentArray, value]);
      }
    },
    [parameters, updateParameters]
  );

  const handleAddChannel = useCallback(() => {
    handleAddArrayElement("channels", channelInputValue);
    setChannelInputValue("");
  }, [channelInputValue, handleAddArrayElement]);

  const handleAddApplication = useCallback(() => {
    handleAddArrayElement("applications", applicationInputValue);
    setApplicationInputValue("");
  }, [applicationInputValue, handleAddArrayElement]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
        const { categoryMapper, productMapper, productCategoryPathMapper } =
          currentParameters;
        setUnvalidatedBlueprints((defaultUnvalidatedBlueprints) => ({
          ...defaultUnvalidatedBlueprints,
          ...(categoryMapper !== undefined && { categoryMapper }),
          ...(productMapper !== undefined && { productMapper }),
          ...(productCategoryPathMapper !== undefined && {
            productCategoryPathMapper,
          }),
        }));
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  /* eslint-disable no-template-curly-in-string*/
  useEffect(() => {
    const baseContainsReplaceIndicator = (base: string, filter: string) =>
      base.includes(filter);
    const getBaseErrorComponents = (
      base: string,
      channels: Array<string>,
      applications: Array<string>
    ) => {
      const filters = [];
      const locations = [];
      const requiredFilters = ["${channel}", "${application}"];
      const requiredLocations = ["channel", "application"];

      if (
        channels?.length &&
        !baseContainsReplaceIndicator(base, requiredFilters[0])
      ) {
        filters.push(requiredFilters[0]);
        locations.push(requiredLocations[0]);
      }
      if (
        applications?.length &&
        !baseContainsReplaceIndicator(base, requiredFilters[1])
      ) {
        filters.push(requiredFilters[1]);
        locations.push(requiredLocations[1]);
      }
      return {
        filters,
        locations,
      };
    };

    const { apiBase, channels, applications } = parameters;
    const { filters, locations } = getBaseErrorComponents(
      apiBase,
      channels,
      applications
    );
    const baseError = filters.length
      ? `Please include ${filters.join(
          " and "
        )} in the Api Base to indicate the location of the ${locations.join(
          " and "
        )}`
      : "";
    setErrors((prevErrors) => ({
      ...prevErrors,
      apiBase: !apiBase || apiBase === "" ? "Please input a value" : baseError,
      channels:
        baseContainsReplaceIndicator(apiBase, "${channel}") && !channels?.length
          ? "Please add at least 1 channel"
          : "",
      applications:
        baseContainsReplaceIndicator(apiBase, "${application}") &&
        !applications?.length
          ? "Please add at least 1 application"
          : "",
    }));
  }, [parameters]);
  /* eslint-enable no-template-curly-in-string*/

  useEffect(() => {
    const { categoryMapper, productMapper, productCategoryPathMapper } =
      unvalidatedBlueprints;
    const handleMapperUpdate = (mapper: Blueprint, mapperName: string) => {
      const errors = validateObjectParameter(mapper);
      if (Object.values(errors).every((error) => error === "")) {
        setParameters((prevParameters) => ({
          ...prevParameters,
          [mapperName]: mapper,
        }));
      }
      setErrors((prevErrors) => ({
        ...prevErrors,
        [mapperName]: errors,
      }));
    };
    if (categoryMapper) {
      handleMapperUpdate(categoryMapper, "categoryMapper");
    }
    if (productMapper) {
      handleMapperUpdate(productMapper, "productMapper");
    }
    if (productCategoryPathMapper) {
      handleMapperUpdate(
        productCategoryPathMapper,
        "productCategoryPathMapper"
      );
    }
  }, [unvalidatedBlueprints, validateObjectParameter]);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      fullWidth
      marginTop="spacing3Xl"
    >
      <Form
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "50%",
        }}
      >
        <Heading>App Config</Heading>
        <FormInputField
          isRequired
          errorMessage={errors.apiBase}
          label="API Base"
          helpText="The base URL of the API you intend to connect to"
          value={parameters.apiBase}
          onChange={(value) => updateParameters("apiBase", value)}
        />
        <FormInputField
          label="Image Base"
          helpText="The image endpoint on which the image URL returned from the API
          builds:"
          value={parameters.imageBase as string}
          onChange={(value) => updateParameters("imageBase", value)}
        />
        <div>
          <Stack alignItems="end" spacing="spacingXs" marginBottom="spacingM">
            <FormInputField
              label="Channels"
              helpText="The channels that can be used within the application"
              errorMessage={errors.channels}
              value={channelInputValue}
              onChange={(value) => {
                setChannelInputValue(value);
              }}
              onKeyDown={({ key }) => {
                if (key.toLowerCase() === "enter") {
                  handleAddChannel();
                }
              }}
              style={{ marginBottom: 0 }}
            />
            <IconButton
              icon={<PlusCircleTrimmedIcon />}
              variant="secondary"
              onClick={handleAddChannel}
              aria-label={"Add channel"}
            />
          </Stack>

          <Stack
            flexDirection="row"
            marginBottom="spacingM"
            style={{ overflowX: "auto" }}
            paddingBottom={"spacingXs"}
          >
            {parameters.channels?.map((channel, i) => (
              <Pill
                key={i}
                label={channel}
                onClose={() =>
                  updateParameters(
                    "channels",
                    parameters?.channels.filter(
                      (currentChannel) => channel !== currentChannel
                    )
                  )
                }
              />
            ))}
          </Stack>
        </div>
        <div>
          <Stack alignItems="end" spacing="spacingXs" marginBottom="spacingM">
            <FormInputField
              label="Applications"
              helpText="The applications that can be used within the application"
              errorMessage={errors.applications}
              value={applicationInputValue}
              onChange={(value) => {
                setApplicationInputValue(value);
              }}
              onKeyDown={({ key }) => {
                if (key.toLowerCase() === "enter") {
                  handleAddApplication();
                }
              }}
              style={{ marginBottom: 0 }}
            />
            <IconButton
              icon={<PlusCircleTrimmedIcon />}
              variant="secondary"
              onClick={handleAddApplication}
              aria-label={"Add application"}
            />
          </Stack>

          <Stack
            flexDirection="row"
            marginBottom="spacingM"
            style={{ overflowX: "auto" }}
            paddingBottom={"spacingXs"}
          >
            {parameters.applications?.map((application, i) => (
              <Pill
                key={i}
                label={application}
                onClose={() =>
                  updateParameters(
                    "applications",
                    parameters?.applications.filter(
                      (currentApplication) => application !== currentApplication
                    )
                  )
                }
              />
            ))}
          </Stack>
        </div>

        <Heading as="h2">Mappers</Heading>
        <Note variant="primary" style={{ marginBottom: "1em" }}>
          Below are the configuration fields for the mappers used within the
          application. These mappers are used to convert the api response
          structure to an interpretable object which can be used within the
          application.
          <br />
          <br />
          It is possible to filter for a specific value, a specific key of an
          object in an array or just group all values of a specific type (only
          applicable for arrays).
          <br />
          <br />
          <Text fontWeight="fontWeightDemiBold">Single value retrieval :</Text>
          {" id or price.value"}
          <br />
          <Text fontWeight="fontWeightDemiBold">
            Find object in array with key :
          </Text>
          {" attributes{name: sku}.value"}
          <br />
          <Text fontWeight="fontWeightDemiBold">
            Map all values of an array of object with a specific key :
          </Text>
          {" subCategories[id]"}
        </Note>
        <Stack
          flexDirection="column"
          alignItems="baseline"
          fullWidth
          spacing="spacingXl"
        >
          <Stack flexDirection="column" alignItems="baseline" fullWidth>
            <fieldset
              style={{
                padding: "1em",
                width: "100%",
                borderRadius: "6px",
                border: "solid 1px #CFD9E0",
              }}
            >
              <legend>
                <Subheading style={{ marginBottom: "0" }}>
                  Product Mapper
                </Subheading>
              </legend>
              <FormInputField
                label="Sku"
                helpText="The sku value of the product"
                value={unvalidatedBlueprints.productMapper.sku}
                isRequired
                errorMessage={errors.productMapper.sku}
                onChange={(value) =>
                  updateObject("productMapper", "sku", value)
                }
              />
              <FormInputField
                label="Brand"
                helpText="The brandname of the product"
                value={unvalidatedBlueprints.productMapper.brand}
                isRequired
                errorMessage={errors.productMapper.brand}
                onChange={(value) =>
                  updateObject("productMapper", "brand", value)
                }
              />
              <FormInputField
                label="Image"
                helpText="The image uri product"
                value={unvalidatedBlueprints.productMapper.image}
                isRequired
                errorMessage={errors.productMapper.image}
                onChange={(value) =>
                  updateObject("productMapper", "image", value)
                }
              />
              <FormInputField
                label="Price"
                helpText="The price of the product"
                value={unvalidatedBlueprints.productMapper.price}
                isRequired
                errorMessage={errors.productMapper.price}
                onChange={(value) =>
                  updateObject("productMapper", "price", value)
                }
              />
              <FormInputField
                label="Name"
                helpText="The name of the product"
                value={unvalidatedBlueprints.productMapper.title}
                isRequired
                errorMessage={errors.productMapper.title}
                onChange={(value) =>
                  updateObject("productMapper", "title", value)
                }
              />
              <FormInputField
                label="Default Category"
                helpText="The category metadata under which the product is listed"
                value={unvalidatedBlueprints.productMapper.defaultCategory}
                isRequired
                errorMessage={errors.productMapper.defaultCategory}
                onChange={(value) =>
                  updateObject("productMapper", "defaultCategory", value)
                }
              />
            </fieldset>
          </Stack>
          <Stack flexDirection="column" alignItems="baseline" fullWidth>
            <fieldset
              style={{
                padding: "1em",
                width: "100%",
                borderRadius: "6px",
                border: "solid 1px #CFD9E0",
              }}
            >
              <legend>
                <Subheading style={{ marginBottom: "0" }}>
                  Product Category Mapper
                </Subheading>
              </legend>
              <Note variant="primary" style={{ marginBottom: "1em" }}>
                This mapper is based on the value of the default category field
                of the product mapper
              </Note>
              <FormInputField
                label="Id"
                helpText="The id of the category under which the product is listed"
                value={unvalidatedBlueprints.productCategoryPathMapper.id}
                isRequired
                errorMessage={errors.productCategoryPathMapper.id}
                onChange={(value) =>
                  updateObject("productCategoryPathMapper", "id", value)
                }
              />
              <FormInputField
                label="CategoryPath"
                helpText="An array containing the ids of all categories in the category path"
                value={
                  unvalidatedBlueprints.productCategoryPathMapper.categoryPath
                }
                isRequired
                errorMessage={errors.productCategoryPathMapper.categoryPath}
                onChange={(value) =>
                  updateObject(
                    "productCategoryPathMapper",
                    "categoryPath",
                    value
                  )
                }
              />
            </fieldset>
          </Stack>
          <Stack
            flexDirection="column"
            alignItems="baseline"
            fullWidth
            style={{ marginBottom: "2rem" }}
          >
            <fieldset
              style={{
                padding: "1em",
                width: "100%",
                borderRadius: "6px",
                border: "solid 1px #CFD9E0",
              }}
            >
              <legend>
                <Subheading style={{ marginBottom: "0" }}>
                  Category Mapper
                </Subheading>
              </legend>

              <FormInputField
                label="Id"
                helpText="The id of the category"
                value={unvalidatedBlueprints.categoryMapper.id}
                isRequired
                errorMessage={errors.categoryMapper.id}
                onChange={(value) =>
                  updateObject("categoryMapper", "id", value)
                }
              />
              <FormInputField
                label="Name"
                helpText="The name of the category"
                value={unvalidatedBlueprints.categoryMapper.title}
                isRequired
                errorMessage={errors.categoryMapper.title}
                onChange={(value) =>
                  updateObject("categoryMapper", "title", value)
                }
              />
              <FormInputField
                label="Category Path"
                helpText="The ids of all categories leading up to this category"
                value={unvalidatedBlueprints.categoryMapper.categoryPath}
                isRequired
                errorMessage={errors.categoryMapper.categoryPath}
                onChange={(value) =>
                  updateObject("categoryMapper", "categoryPath", value)
                }
              />
              <FormInputField
                label="Sub Categories"
                helpText="The array containing the subcategories of the category"
                value={unvalidatedBlueprints.categoryMapper.subCategories}
                isRequired
                errorMessage={errors.categoryMapper.subCategories}
                onChange={(value) =>
                  updateObject("categoryMapper", "subCategories", value)
                }
              />
              <FormInputField
                label="Total Products"
                helpText="The amount of products listed for this category"
                value={unvalidatedBlueprints.categoryMapper.totalProducts}
                isRequired
                errorMessage={errors.categoryMapper.totalProducts}
                onChange={(value) =>
                  updateObject("categoryMapper", "totalProducts", value)
                }
              />
              <FormInputField
                label="Image"
                helpText="The image representing the category"
                value={unvalidatedBlueprints.categoryMapper.image}
                isRequired
                errorMessage={errors.categoryMapper.image}
                onChange={(value) =>
                  updateObject("categoryMapper", "image", value)
                }
              />
            </fieldset>
          </Stack>
        </Stack>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
