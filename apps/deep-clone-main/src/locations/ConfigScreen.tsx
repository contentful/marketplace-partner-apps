import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { Heading, Card, Tabs, Stack, FormControl, TextInput, Radio, Paragraph, FormLabel } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SelectContentTypes } from '@contentful/app-components';
import { AppParameters } from '../vite-env';
import { ConfigAppSDK } from '@contentful/app-sdk';

interface ConfigParameters {
  cloneTextBefore: boolean;
  cloneAssets: boolean;
  cloneText: string;
  automaticRedirect: boolean;
  msToRedirect: string | number;
  selectedContentTypes?: string[];
}

interface ConfigResult {
  parameters: AppParameters;
}

function ConfigScreen() {
  const [parameters, setParameters] = useState<ConfigParameters>({
    cloneTextBefore: true,
    cloneAssets: false,
    cloneText: 'Copy',
    automaticRedirect: true,
    msToRedirect: 5000,
  });

  // Add state for selected content types
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

  const sdk = useSDK() as ConfigAppSDK;

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters as ConfigParameters);
        // Initialize selected content types from parameters if they exist
        if (currentParameters.selectedContentTypes) {
          setSelectedContentTypes(currentParameters.selectedContentTypes);
        }
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const onConfigure = useCallback(async (): Promise<ConfigResult> => {
    // Ensure all parameters are properly formatted
    const formattedParameters: AppParameters = {
      ...parameters,
    };

    return {
      parameters: formattedParameters,
    };
  }, [parameters, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  // Handler for content type selection
  const handleContentTypeSelection = useCallback((contentTypeIds: string[]) => {
    console.log('Selected content types:', contentTypeIds);
    setSelectedContentTypes(contentTypeIds);
  }, []);

  const handleCloneTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setParameters({ ...parameters, cloneText: e.target.value });
    },
    [parameters]
  );

  const handleMsToRedirectChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setParameters({ ...parameters, msToRedirect: e.target.value });
    },
    [parameters]
  );

  return (
    <Card style={{ maxWidth: '50em', margin: '3em auto' }}>
      <img src="https://www.svgrepo.com/show/3110/copy.svg" alt="Deep Cloning" style={{ height: '5em', display: 'block' }} />
      <Tabs defaultTab="first">
        <Tabs.List>
          <Tabs.Tab panelId="first">Configuration</Tabs.Tab>
          <Tabs.Tab panelId="second">Content Types</Tabs.Tab>
          <Tabs.Tab panelId="third">Feedback</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="first" style={{ marginTop: '3em' }}>
          <Stack flexDirection="column" alignItems="left">
            <FormControl isRequired isInvalid={!parameters.cloneText}>
              <FormControl.Label>Clone Text</FormControl.Label>
              <TextInput
                value={parameters.cloneText}
                name="cloneText"
                type="clone-text"
                placeholder="Your clone text (before or after the title)"
                onChange={handleCloneTextChange}
              />
              <FormControl.HelpText>Displayed before or after the title of the entry.</FormControl.HelpText>
              {!parameters.cloneText && <FormControl.ValidationMessage>Please, provide your clone text</FormControl.ValidationMessage>}
            </FormControl>

            <FormControl isInvalid={!parameters.cloneTextBefore}>
              <FormLabel>Display 'clone' text before or after</FormLabel>

              <Stack flexDirection="row">
                <Radio
                  id="radiocloneTextBefore"
                  name="radio-clone-text-before"
                  isChecked={parameters.cloneTextBefore}
                  onChange={() => setParameters({ ...parameters, cloneTextBefore: true })}>
                  Before
                </Radio>
                <Radio
                  id="radiocloneTextBefore2"
                  name="radio-clone-text-before2"
                  isChecked={!parameters.cloneTextBefore}
                  onChange={() => setParameters({ ...parameters, cloneTextBefore: false })}>
                  After
                </Radio>
              </Stack>
            </FormControl>
            <FormControl isInvalid={!parameters.automaticRedirect}>
              <FormLabel>Enable Automatic Redirect</FormLabel>
              <Stack flexDirection="row">
                <Radio
                  id="radiocautomaticRedirect"
                  name="radio-automatic-redirect"
                  isChecked={parameters.automaticRedirect}
                  onChange={() => setParameters({ ...parameters, automaticRedirect: true })}>
                  Yes
                </Radio>
                <Radio
                  id="radioautomaticRedirect2"
                  name="radio-automatic-redirect2"
                  isChecked={!parameters.automaticRedirect}
                  onChange={() => setParameters({ ...parameters, automaticRedirect: false })}>
                  No
                </Radio>
              </Stack>
            </FormControl>
            {/* 

            <FormControl isInvalid={!parameters.cloneAssets}>
              <FormLabel>Clone assets</FormLabel>
              <Stack flexDirection="row">
                <Radio
                  id="radioCloneAssets"
                  name="radio-clone-asset"
                  isChecked={parameters.cloneAssets}
                  onChange={() =>
                    setParameters({ ...parameters, cloneAssets: true })
                  }
                >
                  Yes
                </Radio>
                <Radio
                  id="radioCloneAssets2"
                  name="radio-clone-asset2"
                  isChecked={!parameters.cloneAssets}
                  onChange={() =>
                    setParameters({ ...parameters, cloneAssets: false })
                  }
                >
                  No
                </Radio>
              </Stack>
            </FormControl>
            */}

            <FormControl isRequired isInvalid={!parameters.msToRedirect}>
              <FormControl.Label>Milliseconds to redirect</FormControl.Label>
              <TextInput
                value={parameters.msToRedirect.toString()}
                name="msToRedirect"
                type="ms-to-redirect"
                placeholder="The seconds it takes for the redirect"
                onChange={handleMsToRedirectChange}
              />
              <FormControl.HelpText>How quickly should the page redirect to the new entry</FormControl.HelpText>
              {!parameters.msToRedirect && <FormControl.ValidationMessage>Please, provide the seconds for the redirect</FormControl.ValidationMessage>}
            </FormControl>

            <Paragraph>
              <strong>Note:</strong> After saving changes, you may need to refresh your browser for the changes to take effect in the sidebar.
            </Paragraph>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel id="second" style={{ marginTop: '3em' }}>
          <Stack flexDirection="column" alignItems="left" spacing="spacingM">
            <Heading as="h3">Select Content Types</Heading>
            <Paragraph>Choose which content types should have the clone functionality available in their sidebar.</Paragraph>

            <SelectContentTypes cma={sdk.cma} selectedContentTypeIds={selectedContentTypes} onSelectionChange={handleContentTypeSelection} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel id="third" style={{ marginTop: '3em' }}>
          <Heading marginTop="spacingS" as="h3">
            Questions or comments?
          </Heading>
          <Paragraph>
            Please reach out to <a href="mailto:patrick.geers@contentful.com">Patrick Geers</a>
          </Paragraph>
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}

export default ConfigScreen;
