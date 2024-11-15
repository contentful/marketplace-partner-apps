import React, { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  TextInput,
  FormControl,
} from "@contentful/f36-components";
import { css } from "emotion";
import { useSDK } from "@contentful/react-apps-toolkit";
import { GROWTHBOOK_EXPERIMENT_CONTENT_TYPE } from "../utils/shared";

export interface AppInstallationParameters {
  growthbookServerUrl?: string;
  growthbookAPIKey: string;
  datasourceId: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    growthbookServerUrl: "https://api.growthbook.io",
    growthbookAPIKey: "",
    datasourceId: "",
  });
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    await createGrowthbookExperimentContentType();

    return {
      parameters,
      locations: [
        {
          location: "app-config",
          component: "ConfigScreen",
        },
        {
          location: "entry-editor",
          contentType: "GROWTHBOOK_EXPERIMENT_CONTENT_TYPE",
          component: "CustomEntryEditor",
        },
        {
          location: "entry-sidebar",
          contentType: "GROWTHBOOK_EXPERIMENT_CONTENT_TYPE",
          component: "CustomSidebar",
        },
      ],
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [GROWTHBOOK_EXPERIMENT_CONTENT_TYPE]: {
            editor: true,
            sidebar: { position: 0 },
          },
        },
      },
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const createGrowthbookExperimentContentType = useCallback(async () => {
    let growthbookExperimentContainerExists = false;
    try {
      await sdk.cma.contentType.get({
        contentTypeId: GROWTHBOOK_EXPERIMENT_CONTENT_TYPE,
      });
      growthbookExperimentContainerExists = true;
    } catch (err) {
      // TODO: This should have a better method to check if a content type exists
      console.log("err", err);
    }
    if (!growthbookExperimentContainerExists) {
      const growthbookExperimentData = {
        sys: {
          id: GROWTHBOOK_EXPERIMENT_CONTENT_TYPE,
        },
        name: "Growthbook Experiment",
        description:
          "Holds variations for a Growthbook A/B test. You can use this to test which variation will increase the metrics that you care about most and then you can replace it with the winner.",
        displayField: "experimentName",
        fields: [
          {
            localized: false,
            required: true,
            id: "experimentName",
            name: "Experiment Name",
            type: "Symbol",
            omitted: true,
          },
          {
            localized: false,
            required: true,
            id: "trackingKey",
            name: "Tracking Key",
            type: "Symbol",
            omitted: true,
          },
          {
            localized: false,
            required: true,
            id: "featureFlagId",
            name: "Feature Flag Id",
            type: "Symbol",
          },
          {
            localized: false,
            required: true,
            id: "experiment",
            name: "Experiment",
            type: "Object",
            omitted: true,
          },
          {
            localized: false,
            required: true,
            id: "variationNames",
            name: "Variation Names",
            type: "Array",
            items: {
              type: "Symbol",
              validations: [],
            },
            omitted: true,
          },
          {
            localized: false,
            required: true,
            id: "variations",
            name: "Variations",
            type: "Array",
            items: {
              type: "Link",
              validations: [],
              linkType: "Entry",
            },
          },
        ],
      };
      const variantContainer = await sdk.cma.contentType.createWithId(
        { contentTypeId: GROWTHBOOK_EXPERIMENT_CONTENT_TYPE },
        growthbookExperimentData
      );
      await sdk.cma.contentType.publish(
        { contentTypeId: GROWTHBOOK_EXPERIMENT_CONTENT_TYPE },
        variantContainer
      );
    }
  }, [sdk.cma.contentType]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "80px", maxWidth: "800px" })}
    >
      <Form>
        <Heading>App Config</Heading>
        <Paragraph>
          In order to use the Growthbook Experimentation extension within
          Contentful you will need to provide your Growthbook Server, API key,
          and Datasource Id.
        </Paragraph>
        <FormControl>
          <FormControl.Label htmlFor="growthbook-server-url">
            Growthbook API Server URL (defaults to Growthbook Cloud
            api.growthbook.io)
          </FormControl.Label>
          <TextInput
            id="growthbook-server-url"
            name="growthbook-server-url"
            value={
              parameters.growthbookServerUrl || "https://api.growthbook.io"
            }
            style={{ marginBottom: "20px" }}
            onChange={(e) =>
              setParameters({
                ...parameters,
                growthbookServerUrl: e.target.value,
              })
            }
          />
          <FormControl.Label htmlFor="api-key">
            Growthbook API Key
          </FormControl.Label>
          <TextInput
            id="api-key"
            name="api-key"
            value={parameters.growthbookAPIKey || ""}
            style={{ marginBottom: "20px" }}
            onChange={(e) =>
              setParameters({ ...parameters, growthbookAPIKey: e.target.value })
            }
          />
          <FormControl.Label htmlFor="datastore-id">
            Datasource Id (The datasource that tracking data gets sent to)
          </FormControl.Label>
          <TextInput
            id="datastore-id"
            name="datastore-id"
            value={parameters.datasourceId || ""}
            onChange={(e) =>
              setParameters({ ...parameters, datasourceId: e.target.value })
            }
          />
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
