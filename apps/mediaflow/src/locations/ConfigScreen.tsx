import { useCallback, useMemo, useState, useEffect } from 'react';
import { Heading, Form, Paragraph, Flex, FormControl, TextInput, Checkbox, Note, Subheading, Box, Spinner, Stack, TextLink } from '@contentful/f36-components';
import { css } from '@emotion/css';
import type { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import QueryGuide from '../components/QueryGuide';
import tokens from '@contentful/f36-tokens';
import { getAccessToken, initializeTokenManager, isReady } from '../utils/TokenManager';
import { shouldShowMediaflowLinks } from '../utils/MediaflowUrl';
import {
  assignmentsFromState,
  buildTargetState,
  missingCredentials,
  summarizeContentTypes,
  toggleAssignment,
} from '../utils/ContentTypeAssignment';
import type { Assignments, ContentTypeSummary } from '../utils/ContentTypeAssignment';
import type { InstallationParameters } from '../types';

// Where customers get credentials and support
const MEDIAFLOW_CONTACT_URL = 'https://www.mediaflow.com/en/contact/';

// The CMA returns at most 1000 content types per request
const CONTENT_TYPE_PAGE_SIZE = 1000;

const styles = {
  page: css({ margin: tokens.spacing3Xl, maxWidth: '800px' }),
  contentType: css({
    padding: tokens.spacingM,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<InstallationParameters>({}); // Installation parameters.
  const [assignments, setAssignments] = useState<Assignments>({});
  const [contentTypes, setContentTypes] = useState<ContentTypeSummary[] | null>(null); // null while loading
  const [contentTypesError, setContentTypesError] = useState(false);
  const [showValidation, setShowValidation] = useState(false); // Validation messages appear after the first install attempt

  const sdk = useSDK<ConfigAppSDK>();
  const missing = useMemo(() => missingCredentials(parameters), [parameters]);

  const onConfigure = useCallback(async () => {
    if (missing.length > 0) {
      setShowValidation(true);
      sdk.notifier.error("Please fill in: " + missing.join(", ") + ".");
      return false; // Stops the installation
    }
    const currentState: AppState | null = await sdk.app.getCurrentState();
    return {
      parameters, // Installation parameters (clientId, etc.)
      targetState: buildTargetState(assignments, currentState),
    };
  }, [parameters, assignments, missing, sdk]);

  const onConfigurationCompleted = useCallback(async (error: unknown) => {
    if (error) {
      sdk.notifier.error("The app configuration could not be saved. Please try again.");
      return;
    }
    if (!isReady()) {
      initializeTokenManager(sdk);
    }
    try {
      await getAccessToken(true, true); // Awaiting access token to check if the login is successful
      sdk.notifier.success("Mediaflow authentication successful");
    } catch {
      sdk.notifier.error("The app is saved, but Mediaflow authentication failed. Please correct the client ID, client secret and refresh token on this screen and save again.");
    }
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((error) => onConfigurationCompleted(error));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  /**
   * Retrieves the installation parameters and the current content type assignments and sets the app as ready
   * Note that the installation parameters and the state will be null if the app is not installed yet
   */
  useEffect(() => {
    (async () => {
      const [currentParameters, currentState] = await Promise.all([
        sdk.app.getParameters<InstallationParameters>(),
        sdk.app.getCurrentState(),
      ]);
      if (currentParameters) {
        setParameters(currentParameters);
      }
      setAssignments(assignmentsFromState(currentState));

      sdk.app.setReady(); // Hides loading screen
    })();
  }, [sdk]);

  useEffect(() => {
    (async () => {
      try {
        const items = [];
        let total = Infinity;
        while (items.length < total) {
          const page = await sdk.cma.contentType.getMany({ query: { limit: CONTENT_TYPE_PAGE_SIZE, skip: items.length } });
          items.push(...page.items);
          total = page.total;
          if (page.items.length === 0) {
            break;
          }
        }
        setContentTypes(summarizeContentTypes(items));
      } catch (error) {
        console.error("[ERROR] Could not load the content types: ", error);
        setContentTypesError(true);
        setContentTypes([]);
      }
    })();
  }, [sdk]);

  const isMissing = (label: string) => showValidation && missing.includes(label);

  return (
    <Flex flexDirection="column" className={styles.page}>
      <Form>
        <Heading>App Configuration</Heading>
        <Paragraph>
          Welcome to the Mediaflow App.{' '}
          <TextLink href={MEDIAFLOW_CONTACT_URL} target="_blank" rel="noopener noreferrer">Contact Mediaflow</TextLink>{' '}
          to get the OAuth credentials for your Mediaflow account, or for help with the app.
        </Paragraph>

        <FormControl isRequired isInvalid={isMissing("Client ID")}>
          <FormControl.Label>Client ID</FormControl.Label>
          <TextInput
            value={parameters.clientId || ''}
            type="text"
            name="clientId"
            onChange={(e) => { setParameters({ ...parameters, clientId: e.target.value }); }}
          />
          {isMissing("Client ID") && <FormControl.ValidationMessage>Enter the client ID</FormControl.ValidationMessage>}
        </FormControl>

        <FormControl isRequired isInvalid={isMissing("Client secret")}>
          <FormControl.Label>Client secret</FormControl.Label>
          <TextInput
            value={parameters.clientSecret || ''}
            type="password"
            name="clientSecret"
            onChange={(e) => { setParameters({ ...parameters, clientSecret: e.target.value }); }}
          />
          {isMissing("Client secret") && <FormControl.ValidationMessage>Enter the client secret</FormControl.ValidationMessage>}
        </FormControl>

        <FormControl isRequired isInvalid={isMissing("Refresh token")}>
          <FormControl.Label>Refresh token</FormControl.Label>
          <TextInput
            value={parameters.refreshToken || ''}
            type="password"
            name="refreshToken"
            onChange={(e) => { setParameters({ ...parameters, refreshToken: e.target.value }); }}
          />
          {isMissing("Refresh token") && <FormControl.ValidationMessage>Enter the refresh token</FormControl.ValidationMessage>}
        </FormControl>

        <FormControl>
          <Checkbox
            name="showMediaflowLinks"
            isChecked={shouldShowMediaflowLinks(parameters)}
            onChange={(e) => { setParameters({ ...parameters, showMediaflowLinks: e.target.checked }); }}
            helpText="Turn this off if your editors don't have access to Mediaflow. It hides the &quot;Edit in Mediaflow&quot; link and the link in the missing alt text warning."
          >
            Show links to files in Mediaflow
          </Checkbox>
        </FormControl>

        <Heading as="h2">Assign to content types</Heading>
        <Paragraph>Choose the JSON object fields that hold Mediaflow files. The sidebar button updates the metadata of every Mediaflow field in an entry at once.</Paragraph>

        {contentTypes === null && <Spinner />}
        {contentTypesError && (
          <Note variant="negative">The content types could not be loaded. Reload the page to try again.</Note>
        )}
        {contentTypes !== null && !contentTypesError && contentTypes.length === 0 && (
          <Note variant="warning">
            There are no content types with a JSON object field in this environment. Add a JSON object field to a content type, then come back to assign it to Mediaflow.
          </Note>
        )}
        {contentTypes !== null && contentTypes.length > 0 && (
          <Stack flexDirection="column" alignItems="stretch" spacing="spacingM">
            {contentTypes.map((contentType) => {
              const assignment = assignments[contentType.id];
              return (
                <Box key={contentType.id} className={styles.contentType}>
                  <Subheading marginBottom="spacingS">{contentType.name}</Subheading>
                  <Stack flexDirection="column" alignItems="flex-start" spacing="spacingXs">
                    {contentType.jsonFields.map((field) => (
                      <Checkbox
                        key={field.id}
                        name={`${contentType.id}-${field.id}`}
                        isChecked={assignment?.fields.includes(field.id) ?? false}
                        onChange={(e) => { setAssignments(toggleAssignment(assignments, contentType.id, { fieldId: field.id }, e.target.checked)); }}
                      >
                        {field.name}
                      </Checkbox>
                    ))}
                    <Checkbox
                      name={`${contentType.id}-sidebar`}
                      isChecked={assignment?.sidebar ?? false}
                      onChange={(e) => { setAssignments(toggleAssignment(assignments, contentType.id, 'sidebar', e.target.checked)); }}
                    >
                      Sidebar button to update all Mediaflow fields
                    </Checkbox>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Form>

      <QueryGuide />
    </Flex>
  );
};
export default ConfigScreen;
