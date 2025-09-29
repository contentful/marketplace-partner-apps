import { Form, FormControl, GlobalStyles, Heading, Paragraph, TextInput, Checkbox, Select, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { Parameters } from '../../types';
import { editorInterfacesToSelectedFields, SelectedFields, selectedFieldsToTargetState } from './fields';
import { ContentTypeProps } from 'contentful-management';
import { FieldSelector } from './FieldSelector';

const DEFAULT_PARAMETERS: Parameters = {
  installationUuid: '',
  folderPath: '/',
  collectionId: '',
  fileType: '',
  searchQuery: '',
  allowMultipleSelections: true,
  maxFileSelections: '',
  defaultTransformation: '',
  mediaQuality: 'auto'
};

const codeBlockStyle = { fontSize: '12px', fontWeight: 'bold', border: '1px solid #ccc', padding: '2px 4px', borderRadius: '4px' };

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Parameters>(DEFAULT_PARAMETERS);
  const [showAdvancedConfiguration, setShowAdvancedConfiguration] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    // const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: {
        ...parameters,
        installationUuid: parameters.installationUuid || window.crypto.randomUUID(),
      },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [parameters, sdk, contentTypes, selectedFields]);

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
      const [currentParameters, contentTypesResponse, editorInterfacesResponse] = await Promise.all([
        sdk.app.getParameters<Parameters>(),
        sdk.cma.contentType.getMany({}),
        sdk.cma.editorInterface.getMany({}),
      ]);

      if (currentParameters) {
        setParameters({
          ...DEFAULT_PARAMETERS,
          ...currentParameters,
        });
      }

      if (contentTypesResponse) {
        setContentTypes(contentTypesResponse.items);
      }

      setSelectedFields(editorInterfacesToSelectedFields(editorInterfacesResponse.items, sdk.ids.app));

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const mediaQualityOptions = [
    { label: 'Default ImageKit Setting', value: '' },
    ...Array.from({ length: 10 }, (_, i) => ({
      label: `${(i + 1) * 10}`,
      value: `${(i + 1) * 10}`,
    })),
  ];

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, value: string | boolean | number | null) => {
    const key: keyof Parameters = event.target.name as keyof Parameters;
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <GlobalStyles />
      <div style={{
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        top: 0,
        width: '100%',
        height: '300px',
        backgroundColor: '#0450d5',
      }} />
      <div style={{
        height: 'auto',
        minHeight: '65vh',
        margin: '0 auto',
        marginTop: tokens.spacingXl,
        padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
        maxWidth: tokens.contentWidthText,
        backgroundColor: tokens.colorWhite,
        zIndex: 2,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '2px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          <img 
            src="https://ik.imgkit.net/ikmedia/logo/light_T4buIzohVH.svg" 
            alt="ImageKit logo full"
            style={{
              display: 'block',
              width: '175px',
              margin: `${tokens.spacingXl} 0`,
            }} 
          />
        </div>
        <Heading>About ImageKit</Heading>
        <Paragraph>
          ImageKit makes it easy to store, manage, optimize and deliver your media assets at scale. Using this integration, you can directly select and use these assets in your
          Contentful entries and pages, and even upload new assets directly to your ImageKit Media Library, making this the perfect way to manage your media workflows without
          leaving Contentful.
        </Paragraph>
        <hr style={{
          marginTop: tokens.spacingL,
          marginBottom: tokens.spacingL,
          border: 0,
          height: '1px',
          backgroundColor: tokens.gray300,
        }} />
        
        <Heading as="h2" marginTop="spacingL">Quickstart</Heading>
        <Paragraph>
          Getting started with ImageKit is easy and takes less than a minute. To start using this integration, you
          just need to install it to your Contentful space and start using it in your models and entries by selecting the <strong>JSON Object</strong> field type.
        </Paragraph>

        <FieldSelector
          space={sdk.ids.space}
          environment={sdk.ids.environmentAlias ?? sdk.ids.environment}
          contentTypes={contentTypes}
          selectedFields={selectedFields}
          onSelectedFieldChanged={setSelectedFields}
        />

        <Paragraph>
          To understand how to configure the plugin and use it in your entries, refer to the <a href="https://imagekit.io/docs/integration/contentful" target="_blank">official documentation</a>.
        </Paragraph>

        <Paragraph>
          In case you&apos;d like to configure the media library widget, you can do so in the advanced configuration below.
        </Paragraph>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacingXs,
          marginTop: tokens.spacingL,
          padding: tokens.spacingS,
          border: `1px solid ${tokens.gray300}`,
          borderRadius: tokens.borderRadiusMedium,
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: tokens.gray100,
          width: 'fit-content',
        }}
        onClick={() => {
          setShowAdvancedConfiguration(!showAdvancedConfiguration);
        }}
        >
          {showAdvancedConfiguration ? <ChevronUpIcon /> : <ChevronDownIcon />}
          <Text fontWeight="fontWeightMedium">Advanced Configuration</Text>
        </div>

        {
          showAdvancedConfiguration && (
            <div style={{
              animation: 'fadeIn 0.3s ease-in-out',
            }}>
              <Heading as="h2" marginTop="spacingL" id="advanced-configuration">Advanced Configuration</Heading>

              <Heading as="h3" marginTop="spacingL">Media Delivery</Heading>
              <Paragraph>
                These configurations are used to control the delivery of the media assets that are selected from the Media Library Widget and used in your entries.
                <br /><br />
                <strong>Note:</strong> These settings do not affect the delivery of assets already referenced in your entries. To make sure that the assets are delivered
                with the correct settings, you need to update the asset URLs in your entries manually or remove and re-insert the assets.
              </Paragraph>

              <Form style={{ marginTop: tokens.spacingL }}>
                <FormControl marginTop="spacingM">
                  <FormControl.Label>Default Transformation String</FormControl.Label>
                  <TextInput
                    name="defaultTransformation"
                    id="defaultTransformation"
                    value={parameters.defaultTransformation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value)}
                    placeholder="w-200,h-200 or any named transformation"
                  />
                  <FormControl.HelpText>This transformation will be applied to all assets selected from the Media Library Widget. (Leave this blank to use ImageKit's default optimization settings)</FormControl.HelpText>
                </FormControl>

                <FormControl marginTop="spacingM">
                  <FormControl.Label>Media Quality</FormControl.Label>
                  <Select
                    name="mediaQuality"
                    id="mediaQuality"
                    value={parameters.mediaQuality}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e, e.target.value)}
                  >
                    {mediaQualityOptions.map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                  <FormControl.HelpText>This quality setting will be applied to all assets selected from the Media Library Widget. (Default: Use ImageKit's default quality settings which can be configured from the <a href="https://imagekit.io/dashboard/settings/images" target="_blank">ImageKit Dashboard</a>.)</FormControl.HelpText>
                </FormControl>
              </Form>

              <Heading as="h3" marginTop="spacingL">Widget Settings</Heading>
              <Paragraph>
                These configurations are used to control the behavior of the Media Library Widget that is used to select and upload media assets.
              </Paragraph>

              <Form style={{ marginTop: tokens.spacingL }}>
                <FormControl marginTop="spacingM">
                  <FormControl.Label>Starting Folder Path</FormControl.Label>
                  <TextInput
                    name="folderPath"
                    id="folderPath"
                    value={parameters.folderPath}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value)}
                  />
                  <FormControl.HelpText>The folder to open when the Media Library Widget is opened. (Default: <code style={codeBlockStyle}>/</code> i.e. the root folder).</FormControl.HelpText>
                </FormControl>

                <FormControl marginTop="spacingM">
                  <FormControl.Label>Starting Collection ID</FormControl.Label>
                  <TextInput
                    name="collectionId"
                    id="collectionId"
                    value={parameters.collectionId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value)}
                  />
                  <FormControl.HelpText>The ID of the specific collection to open when the Media Library Widget is opened. (Leave this blank if you do not want to open any collection, use <code style={codeBlockStyle}>all</code> to open a list of all collections)</FormControl.HelpText>
                </FormControl>

                <FormControl marginTop="spacingM">
                  <FormControl.Label>File Type</FormControl.Label>
                  <TextInput
                    name="fileType"
                    id="fileType"
                    value={parameters.fileType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value)}
                    placeholder="e.g. image"
                  />
                  <FormControl.HelpText>Set this to show only specific types of files when the Media Library Widget is opened. Supported options are <code style={codeBlockStyle}>"images" | "videos" | "cssJs" | "others"</code>. (Leave this blank to show all types of files which is the default behavior)</FormControl.HelpText>
                </FormControl>

                <FormControl marginTop="spacingM">
                  <FormControl.Label>Default Search Query</FormControl.Label>
                  <TextInput
                    name="searchQuery"
                    id="searchQuery"
                    value={parameters.searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value)}
                  />
                  <FormControl.HelpText>The search query to be used when the Media Library Widget is opened. (Leave this blank to open the widget with no search query which is the default behavior)</FormControl.HelpText>
                </FormControl>

                <FormControl marginTop="spacingM">
                  <Checkbox
                    name="allowMultipleSelections"
                    id="allowMultipleSelections"
                    isChecked={parameters.allowMultipleSelections}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.checked)}
                  >
                    Allow Multiple Selections
                  </Checkbox>
                </FormControl>

                {
                  parameters.allowMultipleSelections && (
                    <FormControl marginTop="spacingM">
                      <FormControl.Label>Maximum Number of Files Per Selection</FormControl.Label>
                      <TextInput
                        name="maxFileSelections"
                        id="maxFileSelections"
                        type="number"
                        value={parameters.maxFileSelections?.toString() || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, e.target.value ? parseInt(e.target.value) : null)}
                        min="1"
                      />
                      <FormControl.HelpText>Maximum number of files that can be selected per selection. (Leave this blank to allow unlimited selections which is the default behavior)</FormControl.HelpText>
                    </FormControl>
                  )
                }
              </Form>
          </div>
          )
        }
      </div>
    </>
  );
};

export default ConfigScreen;
