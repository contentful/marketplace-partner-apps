import React, { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK, ContentType } from "@contentful/app-sdk";
import {
  Form,
  Paragraph,
  Flex,
  TextInput,
  FormControl,
} from "@contentful/f36-components";
import { css } from "@emotion/css";
import { useSDK } from "@contentful/react-apps-toolkit";
import { styles } from "./ConfigScreen.styles";
import getSchema, { ContentTypeConfiguration } from "../schema";

const createAndPublishContentType = async (
  sdk: ConfigAppSDK,
  { fields, id, ...contentType }: ContentTypeConfiguration,
): Promise<void> => {
  try {
    // @todo: At the moment I'm not able to use the helpText to write into the editor interface.
    // That's because you can't update without one existing and can't create either.
    const fieldsWithoutHelpText = fields.map(({ helpText, ...field }) => field);
    const { sys } = await sdk.cma.contentType.createWithId(
      { contentTypeId: id },
      { fields: fieldsWithoutHelpText, ...contentType },
    );

    await sdk.cma.contentType.publish(
      { contentTypeId: sys.id },
      {
        sys,
        ...contentType,
        fields: [],
      },
    );

    console.log(`Content type ${contentType.name} created and published.`);
  } catch (error) {
    console.error(`Error creating content type ${contentType.name}:`, error);
  }
};

const updateContentType = (
  sdk: ConfigAppSDK,
  { name, ...contentType }: ContentType,
  label: string,
) => {
  console.log("updating", name, label);
  if (label === name) {
    console.log("skip for " + name);
    return;
  }

  return sdk.cma.contentType.update(
    { contentTypeId: contentType.sys.id },
    {
      name: label,
      ...contentType,
    },
  );
};

export interface AppInstallationParameters {
  productLabel?: string;
  variantLabel?: string;
  taxonomyLabel?: string;
  taxonLabel?: string;
}

const configuration: {
  label: string;
  name: keyof AppInstallationParameters;
  isRequired: boolean;
  helpText: string;
  placeholder: string;
}[] = [
  {
    label: "Product Label",
    name: "productLabel",
    isRequired: false,
    helpText: "The label of the Product content type",
    placeholder: "e.g. Book",
  },
  {
    label: "Variant Label",
    name: "variantLabel",
    isRequired: false,
    helpText: "The label of the Variant content type",
    placeholder: "e.g. Book Type",
  },
  {
    label: "Taxonomy Label",
    name: "taxonomyLabel",
    isRequired: false,
    helpText: "The label of the Taxonomy content type",
    placeholder: "e.g. Category System",
  },
  {
    label: "Taxon Label",
    name: "taxonLabel",
    isRequired: false,
    helpText: "The label of the Taxon content type",
    placeholder: "e.g. Category",
  },
];

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    const schema = getSchema({ localized: false, ...parameters });

    for (const contentType of schema) {
      try {
        const existingContentType = await sdk.cma.contentType.get({
          contentTypeId: contentType.id,
        });
        await updateContentType(sdk, existingContentType, contentType.name);
      } catch {
        console.log("doesn't exist", contentType.name);
        await createAndPublishContentType(sdk, contentType);
      }
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
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
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "80px", maxWidth: "800px" })}
    >
      <div className={styles.background}>
        <div className={styles.body}>
          <img
            src="assets/header-light.png"
            alt="Contentful Commerce by Commerce Layer"
          />
          <div className={styles.content}>
            <Paragraph>
              Welcome to the Configuration page of the Contentful Commerce app,
              powered by Commerce Layer. This interface is designed to
              streamline your journey in setting up a product catalog within
              Contentful. Tailor your content model to fit your unique commerce
              needs by customizing content type labels, which will be reflected
              across your Contentful environment.
            </Paragraph>
            <Paragraph>
              Please note that while you can personalize the display labels, the
              underlying ID used in the API responses will remain consistent,
              ensuring a stable and seamless integration. Start configuring your
              content types below to enhance your ecommerce experience.
            </Paragraph>
            <hr className={styles.splitter} />
            <Form>
              {configuration.map((field) => {
                return (
                  <FormControl isInvalid={false} key={field.name}>
                    <FormControl.Label>{field.label}</FormControl.Label>
                    <TextInput
                      name={field.name}
                      id={field.name}
                      placeholder={field.placeholder}
                      value={parameters[field.name] || ""}
                      onChange={(e) => {
                        setParameters({
                          ...parameters,
                          [field.name]: e.target.value,
                        });
                      }}
                    />
                    <FormControl.HelpText>
                      {field.helpText}
                    </FormControl.HelpText>
                  </FormControl>
                );
              })}
            </Form>
          </div>
        </div>
        <div className={styles.icon}>
          <img
            src="assets/commercelayer-glyph-black.png"
            alt="Commerce Layer logo"
          />
        </div>
      </div>
    </Flex>
  );
};

export default ConfigScreen;
