import React, { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Flex,
  FormControl,
  TextInput,
  Paragraph,
} from "@contentful/f36-components";
import { css } from "emotion";
import { useSDK } from "@contentful/react-apps-toolkit";
import { VARIANT_CONTAINER } from "../utils/shared";

export interface AppInstallationParameters {
  orgId: string;
  managementApiKey: string;
}

const OrgId = ({
  orgId,
  setOrgId,
}: {
  orgId: string;
  setOrgId: (orgId: string) => void;
}) => {
  return (
    <FormControl isRequired isInvalid={!orgId}>
      <FormControl.Label>Org URL</FormControl.Label>
      <TextInput
        value={orgId}
        type="text"
        name="orgId"
        onChange={(e) => setOrgId(e.target.value)}
      />
      <FormControl.HelpText>Provide your org URL</FormControl.HelpText>
      {!orgId && (
        <FormControl.ValidationMessage>
          Please, provide your org URL
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

const ManagementApiKeyField = ({
  managementApiKey,
  setManagementApiKey,
}: {
  managementApiKey: string;
  setManagementApiKey: (managementApiKey: string) => void;
}) => {
  const sdk = useSDK<ConfigAppSDK>();

  if (sdk.parameters.installation.managementApiKey) {
    return (
      <>
        <FormControl.Label>Management API Key</FormControl.Label>
        <Paragraph>
          <TextInput
            value="************"
            type="text"
            name="managementApiKey"
            isDisabled
          />
        </Paragraph>
        <FormControl.HelpText>
          Management API key has already been provided, and is not readable
          anymore.
        </FormControl.HelpText>
      </>
    );
  }
  return (
    <FormControl isRequired /* isInvalid={!managementApiKey} */>
      <FormControl.Label>Management API Key</FormControl.Label>
      <TextInput
        value={managementApiKey}
        type="text"
        name="managementApiKey"
        onChange={(e) => setManagementApiKey(e.target.value)}
      />
      <FormControl.HelpText>
        Provide your management API key
      </FormControl.HelpText>
      {!managementApiKey && (
        <FormControl.ValidationMessage>
          Please, provide your management API key
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    orgId: "",
    managementApiKey: "",
  });

  const createVariantContainerContentType = useCallback(async () => {
    let variantContainerExists = false;
    try {
      await sdk.cma.contentType.get({
        contentTypeId: VARIANT_CONTAINER,
      });
      variantContainerExists = true;
    } catch (err) {
      // TODO: This should have a better method to check if a content type exists
      console.log("err", err);
    }
    if (!variantContainerExists) {
      const variantData = {
        sys: {
          id: VARIANT_CONTAINER,
        },
        name: "Variant Container",
        displayField: "experimentId",
        fields: [
          {
            localized: false,
            required: true,
            id: "experimentId",
            name: "Experiment ID",
            type: "Symbol",
          },
          {
            localized: false,
            required: true,
            id: "experiment",
            name: "Experiment",
            type: "Object",
          },
          {
            localized: false,
            required: true,
            id: "meta",
            name: "Meta",
            type: "Object",
          },
          {
            localized: false,
            required: true,
            id: "variants",
            name: "Variants",
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
        { contentTypeId: VARIANT_CONTAINER },
        variantData
      );
      await sdk.cma.contentType.publish(
        { contentTypeId: VARIANT_CONTAINER },
        variantContainer
      );
    }
  }, [sdk.cma.contentType]);

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();
    await createVariantContainerContentType();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: {
        ...parameters,
      },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [VARIANT_CONTAINER]: {
            editor: true,
            sidebar: { position: 0 },
          },
        },
      },
    };
  }, [parameters, sdk, createVariantContainerContentType]);

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
      <Heading>Amplitude App Config</Heading>
      <Form>
        <OrgId
          orgId={parameters.orgId}
          setOrgId={(orgId: string) => setParameters({ ...parameters, orgId })}
        />
        <ManagementApiKeyField
          managementApiKey={parameters.managementApiKey}
          setManagementApiKey={(managementApiKey: string) => {
            setParameters({ ...parameters, managementApiKey });
          }}
        />
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
