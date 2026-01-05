import { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  TextInput,
  List,
  TextLink,
} from "@contentful/f36-components";
import { css } from "emotion";
import { useSDK } from "@contentful/react-apps-toolkit";

// Update the interface to include the token
export interface AppInstallationParameters {
  cmaToken?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

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
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "80px", maxWidth: "800px" })}
    >
      <Form>
        <Heading style={{marginBottom:'16px'}}>Content Auditor Configuration</Heading>
        <Paragraph style={{marginBottom:'16px'}}>
          The Content Auditor app helps you identify and clean up unused content in your Contentful space. 
          It can find:
        </Paragraph>
        <List style={{marginBottom:'20px'}}>
          <List.Item>
            <strong>Unlinked Content Entries</strong> - Entries that aren't referenced by any other content
          </List.Item>
          <List.Item>
            <strong>Unused Media Assets</strong> - Images and files that aren't used in any entries
          </List.Item>
          <List.Item>
            <strong>Unused Content Types</strong> - Content types with no associated entries
          </List.Item>
        </List>
        <Paragraph style={{marginBottom:'20px'}}>
          To get started, please provide your Content Management API (CMA) token. 
          This token allows the app to read and manage content in your space. 
          You can generate a CMA token by clicking your profile icon, then going to Account Settings &gt; CMA Tokens, or visit the{' '}
          <TextLink href={`https://app.contentful.com/spaces/${sdk.ids.space}/api/cma_tokens`} target="_blank">
            CMA Tokens page
          </TextLink>
          {' '}directly.
        </Paragraph>

        <TextInput
          name="cmaToken"
          placeholder="Enter CMA Token"
          value={parameters.cmaToken || ""}
          onChange={(e) =>
            setParameters((prev) => ({
              ...prev,
              cmaToken: e.target.value,
            }))
          }
        />
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
