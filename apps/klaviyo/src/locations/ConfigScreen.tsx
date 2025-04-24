import React, { useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Form,
  FormControl,
  TextInput,
  Button,
  Stack,
  Heading,
  Note,
  Box,
  Text,
  Flex,
  TextLink,
  Paragraph
} from '@contentful/f36-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FieldMapping } from '../config/klaviyo';
import type { AppExtensionSDK } from '@contentful/app-sdk';

interface ConfigScreenProps {
  mappings?: FieldMapping[];
}

interface AppInstallationParameters {
  klaviyoApiKey: string;
  klaviyoCompanyId: string;
}

const validationSchema = Yup.object().shape({
  klaviyoApiKey: Yup.string().required('API Key is required'),
  klaviyoCompanyId: Yup.string().required('Company ID is required'),
});

// Styles for the step indicator
const stepIndicatorStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: '#e5ebed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '16px',
  fontWeight: 600,
  color: '#536471'
};

// Styles for the container
const containerStyle = {
  padding: '24px',
  border: '1px solid #e5ebed',
  borderRadius: '6px',
  width: '100%'
};

// Styles for the section
const sectionStyle = {
  marginBottom: '16px',
  width: '100%'
};

// Style for divider line
const dividerStyle = {
  height: '1px',
  backgroundColor: '#e5ebed',
  margin: '12px 0',
  width: '100%'
};

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ mappings = [] }) => {
  const sdk = useSDK<AppExtensionSDK>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [parameters, setParameters] = React.useState<AppInstallationParameters | null>(null);

  const formik = useFormik({
    initialValues: {
      klaviyoApiKey: '',
      klaviyoCompanyId: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSaving(true);
      try {
        setParameters(values as AppInstallationParameters);
        sdk.notifier.success('Configuration saved successfully!');
      } catch (error) {
        sdk.notifier.error('Error saving configuration');
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    },
  });

  React.useEffect(() => {
    const loadParameters = async () => {
      const parameters = await sdk.app.getParameters();
      if (parameters) {
        setParameters(parameters as AppInstallationParameters);
        formik.setValues({
          klaviyoApiKey: parameters.klaviyoApiKey || '',
          klaviyoCompanyId: parameters.klaviyoCompanyId || '',
        });
      }
    };
    loadParameters();
    sdk.app.setReady();
  }, [sdk]);

  const onConfigure = async () => {
    const parameters = await sdk.app.getParameters();
    if (parameters) {
      setParameters(parameters as AppInstallationParameters);
      return {
        parameters: {
          ...parameters,
          mappings // Include the mappings in the app configuration
        },
        targetState: {
          EditorInterface: {
            [parameters.klaviyoApiKey]: {
              editors: { position: 0 },
            },
          },
        },
      }
    }
    return {}
  }
  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure())
  }, [sdk, mappings])

  return (
    <Box maxWidth="768px" style={{ margin: '0 auto' }} padding="spacingL">
      <Stack flexDirection="column" spacing="spacingS" style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box style={containerStyle}>
          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>1</Box>
              <Heading>Set up Klaviyo App</Heading>
            </Flex>
            <Paragraph>
              Connect Contentful with Klaviyo to sync your content directly to Klaviyo campaigns.
              This integration enables you to maintain consistent content across marketing channels.
            </Paragraph>
            <Paragraph>
              Learn more about how to connect Contentful with Klaviyo{' '}
              <TextLink 
                href="https://www.klaviyo.com/partners/contentful" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                here
              </TextLink>.
            </Paragraph>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>2</Box>
              <Heading>Configure access</Heading>
            </Flex>
            <Paragraph marginBottom="spacingS">
              Input your Klaviyo API credentials to authenticate the connection between Contentful and Klaviyo.
            </Paragraph>

            <Form onSubmit={formik.handleSubmit}>
              <Stack spacing="spacingS">
                <FormControl>
                  <FormControl.Label>Your Key (required)</FormControl.Label>
                  <TextInput
                    name="klaviyoApiKey"
                    value={formik.values.klaviyoApiKey}
                    onChange={formik.handleChange}
                    type="password"
                    placeholder="ex. pk_xxxxx-xxxxx-xxxxx"
                    width="100%"
                  />
                  {formik.errors.klaviyoApiKey && (
                    <Note variant="negative">{formik.errors.klaviyoApiKey}</Note>
                  )}
                </FormControl>

                <FormControl>
                  <FormControl.Label>Your Company ID (required)</FormControl.Label>
                  <TextInput
                    name="klaviyoCompanyId"
                    value={formik.values.klaviyoCompanyId}
                    onChange={formik.handleChange}
                    placeholder="ex. 123456"
                    width="100%"
                  />
                  {formik.errors.klaviyoCompanyId && (
                    <Note variant="negative">{formik.errors.klaviyoCompanyId}</Note>
                  )}
                </FormControl>
              </Stack>
            </Form>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Box style={stepIndicatorStyle}>3</Box>
              <Heading>Set up rules</Heading>
            </Flex>
            <Paragraph>
              Configure how content should be synced from Contentful to Klaviyo. Define field mappings
              and content transformation rules.
            </Paragraph>
            {mappings.length > 0 ? (
              <Box marginTop="spacingS">
                <Text fontWeight="fontWeightMedium">Current mappings: {mappings.length}</Text>
                <Text>Your content mappings are configured and ready to use.</Text>
              </Box>
            ) : (
              <Box marginTop="spacingS">
                <Text>No content mappings configured yet. Add mappings from the content entry sidebar.</Text>
              </Box>
            )}
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Heading>Disclaimer</Heading>
            </Flex>
            <Paragraph>
              This app syncs content from Contentful to Klaviyo through secure API connections.
              Make sure you have the necessary permissions in both Contentful and Klaviyo before using this integration.
            </Paragraph>
            <Box style={dividerStyle} />
          </Box>

          <Box style={sectionStyle}>
            <Flex alignItems="flex-start" marginBottom="spacingS">
              <Heading>Additional section</Heading>
            </Flex>
            <Paragraph>
              Need more help? Check out our documentation or contact support for assistance
              with setting up and using the Klaviyo integration.
            </Paragraph>
          </Box>
        </Box>

        <Box marginTop="spacingM">
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              formik.handleSubmit();
            }}
            isDisabled={isSaving}
            isLoading={isSaving}
            variant="primary"
          >
            Save
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
