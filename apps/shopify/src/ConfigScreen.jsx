import { useEffect, useState } from 'react';
import { Form, FormControl, GlobalStyles, Heading, Note, Paragraph, Select, TextInput } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { editorInterfacesToSelectedFields, getCompatibleFields, selectedFieldsToTargetState } from '@contentful/ecommerce-app-base/lib/AppConfig/fields';
import FieldSelector from '@contentful/ecommerce-app-base/lib/AppConfig/FieldSelector';

function getDefaultParameters(parameterDefinitions) {
  return parameterDefinitions.reduce((acc, definition) => {
    acc[definition.id] = definition.default ?? '';
    return acc;
  }, {});
}

export function ConfigScreen({ integration, parameterDefinitions, sdk }) {
  const [contentTypes, setContentTypes] = useState([]);
  const [compatibleFields, setCompatibleFields] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [fieldSkuTypes, setFieldSkuTypes] = useState({});
  const [parameters, setParameters] = useState(() => getDefaultParameters(parameterDefinitions));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    sdk.app.onConfigure(() => {
      const error = integration.validateParameters(parameters);

      if (error) {
        sdk.notifier.error(error);
        return false;
      }

      return {
        parameters: {
          ...parameters,
          skuTypes: fieldSkuTypes,
        },
        targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
      };
    });
  }, [contentTypes, fieldSkuTypes, integration, parameters, sdk, selectedFields]);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      const [contentTypesResponse, editorInterfacesResponse, installationParameters] = await Promise.all([
        sdk.space.getContentTypes(),
        sdk.space.getEditorInterfaces(),
        sdk.app.getParameters(),
      ]);

      if (!isMounted) {
        return;
      }

      const compatibleFieldMap = getCompatibleFields(contentTypesResponse.items);
      const availableContentTypes = contentTypesResponse.items.filter((contentType) => {
        return compatibleFieldMap[contentType.sys.id]?.length > 0;
      });

      const initialParameters = parameterDefinitions.reduce((acc, definition) => {
        acc[definition.id] = installationParameters?.[definition.id] ?? definition.default ?? '';
        return acc;
      }, {});

      setContentTypes(availableContentTypes);
      setCompatibleFields(compatibleFieldMap);
      setSelectedFields(editorInterfacesToSelectedFields(editorInterfacesResponse.items, sdk.ids.app));
      setFieldSkuTypes(installationParameters?.skuTypes ?? {});
      setParameters(initialParameters);
      setIsReady(true);
      sdk.app.setReady();
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [parameterDefinitions, sdk]);

  return (
    <SDKProvider>
      <GlobalStyles />
      <Heading>About {integration.name}</Heading>
      <Paragraph>{integration.description}</Paragraph>

      <Heading marginTop="spacingXl">Configuration</Heading>
      <Form>
        <FormControl id="config-input-storefrontAccessToken">
          <FormControl.Label>Storefront Access Token</FormControl.Label>
          <TextInput
            isRequired
            maxLength={255}
            name="config-input-storefrontAccessToken"
            value={parameters.storefrontAccessToken}
            onChange={(event) => {
              setParameters((current) => ({
                ...current,
                storefrontAccessToken: event.currentTarget.value,
              }));
            }}
          />
          <FormControl.HelpText>The storefront access token to your Shopify store</FormControl.HelpText>
        </FormControl>

        <FormControl id="config-input-apiEndpoint" marginTop="spacingL">
          <FormControl.Label>Store URL</FormControl.Label>
          <TextInput
            isRequired
            maxLength={255}
            name="config-input-apiEndpoint"
            value={parameters.apiEndpoint}
            onChange={(event) => {
              setParameters((current) => ({
                ...current,
                apiEndpoint: event.currentTarget.value,
              }));
            }}
          />
          <FormControl.HelpText>The Shopify store URL (e.g. [your-shop-name].myshopify.com)</FormControl.HelpText>
        </FormControl>

        <FormControl id="config-input-apiVersion" marginTop="spacingL">
          <FormControl.Label>Storefront API Version</FormControl.Label>
          <Select
            isRequired
            name="config-input-apiVersion"
            value={parameters.apiVersion}
            onChange={(event) => {
              setParameters((current) => ({
                ...current,
                apiVersion: event.currentTarget.value,
              }));
            }}>
            {parameterDefinitions
              .find((definition) => definition.id === 'apiVersion')
              ?.options?.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
          </Select>
          <FormControl.HelpText>Choose the Shopify Storefront API version the app should use.</FormControl.HelpText>
        </FormControl>
      </Form>

      <Heading marginTop="spacing2Xl">Assign to fields</Heading>
      {contentTypes.length > 0 ? (
        <Paragraph>
          This app can only be used with <strong>Short text</strong> or <strong>Short text, list</strong> fields. Select which fields you’d like to enable for
          this app.
        </Paragraph>
      ) : (
        <Note variant="warning">
          There are <strong>no content types with Short text or Short text, list</strong> fields in this environment.
        </Note>
      )}

      {isReady ? (
        <FieldSelector
          compatibleFields={compatibleFields}
          contentTypes={contentTypes}
          fieldSkuTypes={fieldSkuTypes}
          selectedFields={selectedFields}
          skuTypes={integration.skuTypes}
          onFieldSkuTypesChange={setFieldSkuTypes}
          onSelectedFieldsChange={setSelectedFields}
        />
      ) : null}
    </SDKProvider>
  );
}
