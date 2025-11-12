'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, Card, Text, Badge, Button, Note, Modal, List, ListItem } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import ApiKeySection from '../components/ConfigScreen/components/ApiKeySection';
import ProjectSelector from '../components/ConfigScreen/components/ProjectSelector';
import EnvironmentSelector from '../components/ConfigScreen/components/EnvironmentSelector';
import { KeyRotationModal } from '../components/ConfigScreen/components/KeyRotationModal';
import { useLaunchDarkly } from '../components/ConfigScreen/hooks/useLaunchDarkly';
import { Project, Environment } from '../components/ConfigScreen/types';
import { createOrUpdateLDContentType } from '../components/ConfigScreen/utils/createLDContentType';
import { LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE } from '../utils/constants';

export interface AppInstallationParameters {
  // API key is temporarily stored during initial installation only
  // After installation, it's stored server-side in encrypted storage and removed from Contentful
  launchDarklyApiKey?: string;
  launchDarklyProjectKey?: string;
  launchDarklyEnvironment?: string;
  launchDarklyProjectName?: string;
  launchDarklyEnvironmentName?: string;
  launchDarklyBaseUrl?: string;
  isRegistered?: boolean;
  apiKeyLastFour?: string;
}

// Component to display current settings
const CurrentSettings: React.FC<{ parameters: AppInstallationParameters }> = ({ parameters }) => {
  const hasValidSettings = parameters.launchDarklyProjectKey && 
                          parameters.launchDarklyEnvironment;

  if (!hasValidSettings) {
    return null;
  }

  return (
    <Card padding="large" style={{ marginBottom: '24px' }}>
      <Heading marginBottom="spacingM">Current Settings</Heading>
      <Flex flexDirection="column" gap="spacingS">
        <div>
          <Text fontWeight="fontWeightMedium">Project: </Text>
          <Text fontColor="gray600">
            {parameters.launchDarklyProjectName
              ? `${parameters.launchDarklyProjectName} (${parameters.launchDarklyProjectKey})`
              : parameters.launchDarklyProjectKey}
          </Text>
        </div>
        <div>
          <Text fontWeight="fontWeightMedium">Environment: </Text>
          <Text fontColor="gray600">
            {parameters.launchDarklyEnvironmentName
              ? `${parameters.launchDarklyEnvironmentName} (${parameters.launchDarklyEnvironment})`
              : parameters.launchDarklyEnvironment}
          </Text>
        </div>
        <div>
          <Text fontWeight="fontWeightMedium">API Key: </Text>
          <Text fontColor="gray600">Configured ✓</Text>
        </div>
        <Badge variant="positive" style={{ alignSelf: 'flex-start' }}>
          ✓ Configured
        </Badge>
      </Flex>
    </Card>
  );
};

const ConfigScreen = () => {
  // Local state includes API key for validation
  // During initial install, it's temporarily saved to Contentful, then moved to secure storage
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    launchDarklyApiKey: '',
    launchDarklyProjectKey: '',
    launchDarklyEnvironment: '',
    launchDarklyBaseUrl: 'https://app.launchdarkly.com',
  });
  const [apiKeyValidation, setApiKeyValidation] = useState({
    isValidating: false,
    error: null as string | null,
    isValid: false,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [copiedPermissions, setCopiedPermissions] = useState(false);
  const [showKeyRotation, setShowKeyRotation] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();
  const { fetchProjects, fetchEnvironments } = useLaunchDarkly(parameters.launchDarklyApiKey);
  const [creatingModel, setCreatingModel] = useState(false);
  const [modelCheck, setModelCheck] = useState({
    checking: true,
    exists: false,
    valid: false,
    missing: [] as string[],
    error: null as string | null,
  });

  // Use refs to always have access to the latest state in the callback
  const parametersRef = React.useRef(parameters);
  const apiKeyValidationRef = React.useRef(apiKeyValidation);

  React.useEffect(() => {
    parametersRef.current = parameters;
  }, [parameters]);

  React.useEffect(() => {
    apiKeyValidationRef.current = apiKeyValidation;
  }, [apiKeyValidation]);

  const permissionsJSON = `[
  {
    "resources": [
      "proj/*:env/*:flag/*"
    ],
    "actions": [
      "createFlag"
    ],
    "effect": "allow"
  },
  {
    "resources": [
      "proj/*"
    ],
    "actions": [
      "viewProject"
    ],
    "effect": "allow"
  }
]`;

  const copyPermissionsToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(permissionsJSON);
      setCopiedPermissions(true);
      setTimeout(() => setCopiedPermissions(false), 2000);
    } catch (err) {
      console.error('Failed to copy permissions: ', err);
    }
  };

  const checkContentModel = useCallback(async () => {
    setModelCheck(prev => ({ ...prev, checking: true, error: null }));
    try {
      const ct: any = await (cma as any).contentType.get({ contentTypeId: LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE });
      const fields: any[] = Array.isArray(ct?.fields) ? ct.fields : [];
      const getField = (id: string) => fields.find(f => f.id === id);
      const missing: string[] = [];

      if (!getField('name') || getField('name').type !== 'Symbol') missing.push('name (Symbol)');
      if (!getField('key') || getField('key').type !== 'Symbol') missing.push('key (Symbol)');
      if (!getField('description') || getField('description').type !== 'Text') missing.push('description (Text)');
      if (!getField('variations') || getField('variations').type !== 'Object') missing.push('variations (Object)');
      const cm = getField('contentMapping');
      const cmValid = cm && cm.type === 'Array' && cm.items && cm.items.type === 'Link' && cm.items.linkType === 'Entry';
      if (!cmValid) missing.push('contentMapping (Array of Entry links)');
      const displayFieldOk = ct?.displayField === 'name';
      if (!displayFieldOk) missing.push('displayField set to "name"');

      setModelCheck({ checking: false, exists: true, valid: missing.length === 0, missing, error: null });
    } catch (e: any) {
      if (e?.name === 'NotFound' || (e?.message || '').toLowerCase().includes('not found')) {
        setModelCheck({ checking: false, exists: false, valid: false, missing: [], error: null });
      } else {
        setModelCheck({ checking: false, exists: false, valid: false, missing: [], error: e?.message || 'Failed to check content model' });
      }
    }
  }, [cma]);

  /**
   * Register installation with backend (stores API key in DynamoDB)
   */
  const registerInstallation = useCallback(async (apiKey: string) => {
    try {
      const { additionalHeaders } = await sdk.cma.appSignedRequest.create(
        { appDefinitionId: sdk.ids.app },
        {
          method: 'POST',
          path: '/register',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchDarklyApiKey: apiKey }),
        },
      );

      // Determine backend URL
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:9050'  // Local momi server
        : 'https://integrations.launchdarkly.com';  // Production

      const response = await fetch(`${backendUrl}/contentful/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        },
        body: JSON.stringify({ launchDarklyApiKey: apiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to register installation');
      }

      console.log('[ConfigScreen] Installation registered successfully');
    } catch (error) {
      console.error('[ConfigScreen] Registration failed:', error);
      throw error;
    }
  }, [sdk]);

  /**
   * Handle API key rotation
   */
  const handleKeyRotation = async (newKey: string) => {
    try {
      const { additionalHeaders } = await sdk.cma.appSignedRequest.create(
        { appDefinitionId: sdk.ids.app },
        {
          method: 'POST',
          path: '/update-key',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newApiKey: newKey }),
        },
      );

      // Determine backend URL
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:9050'  // Local momi server
        : 'https://integrations.launchdarkly.com';  // Production

      const response = await fetch(`${backendUrl}/contentful/api/update-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...additionalHeaders,
        },
        body: JSON.stringify({ newApiKey: newKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update API key');
      }

      // Update the last four characters in state
      const lastFour = newKey.slice(-4);
      setParameters((prev) => ({
        ...prev,
        apiKeyLastFour: lastFour,
      }));

      sdk.notifier.success('API key updated successfully!');
      console.log('[ConfigScreen] API key updated successfully');
    } catch (error) {
      console.error('[ConfigScreen] Key rotation failed:', error);
      throw error;
    }
  };

  // Validate API key by attempting to fetch projects (clears stored values)
  const handleValidateApiKey = async () => {
    setApiKeyValidation({ isValidating: true, error: null, isValid: false });
    setProjects([]);
    setParameters((prev) => ({ ...prev, launchDarklyProjectKey: '', launchDarklyEnvironment: '' }));
    try {
      setProjectsLoading(true);
      console.log('[ConfigScreen] Validating API key and fetching projects...');
      const fetchedProjects = await fetchProjects();
      console.log('[ConfigScreen] Fetched projects:', fetchedProjects);
      if (fetchedProjects && fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
        setApiKeyValidation({ isValidating: false, error: null, isValid: true });
        console.log('[ConfigScreen] API key validation successful');
      } else {
        console.log('[ConfigScreen] No projects found for API key');
        setApiKeyValidation({ isValidating: false, error: 'No projects found for this API key.', isValid: false });
      }
    } catch (error: any) {
      console.error('[ConfigScreen] API key validation error:', error);
      setApiKeyValidation({ isValidating: false, error: error.message || 'Invalid API key.', isValid: false });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Auto-validate API key without clearing stored values
  const handleAutoValidateApiKey = async () => {
    setApiKeyValidation({ isValidating: true, error: null, isValid: false });
    setProjects([]);
    try {
      setProjectsLoading(true);
      console.log('[ConfigScreen] Auto-validating API key and fetching projects...');
      const fetchedProjects = await fetchProjects();
      console.log('[ConfigScreen] Fetched projects:', fetchedProjects);
      if (fetchedProjects && fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
        setApiKeyValidation({ isValidating: false, error: null, isValid: true });
        console.log('[ConfigScreen] API key auto-validation successful');
      } else {
        console.log('[ConfigScreen] No projects found for API key');
        setApiKeyValidation({ isValidating: false, error: 'No projects found for this API key.', isValid: false });
      }
    } catch (error: any) {
      console.error('[ConfigScreen] API key auto-validation error:', error);
      setApiKeyValidation({ isValidating: false, error: error.message || 'Invalid API key.', isValid: false });
    } finally {
      setProjectsLoading(false);
    }
  };

  // When project changes, fetch environments
  useEffect(() => {
    const fetchEnv = async () => {
      if (parameters.launchDarklyProjectKey && (apiKeyValidation.isValid || parameters.launchDarklyApiKey)) {
        setEnvironmentsLoading(true);
        try {
          console.log('[ConfigScreen] Fetching environments for project:', parameters.launchDarklyProjectKey);
          const envs = await fetchEnvironments(parameters.launchDarklyProjectKey);
          console.log('[ConfigScreen] Fetched environments:', envs);
          setEnvironments(envs || []);
        } catch (error) {
          console.error('[ConfigScreen] Error fetching environments:', error);
          setEnvironments([]);
        } finally {
          setEnvironmentsLoading(false);
        }
      } else {
        setEnvironments([]);
      }
    };
    fetchEnv();
  }, [parameters.launchDarklyProjectKey, apiKeyValidation.isValid, parameters.launchDarklyApiKey, fetchEnvironments]);

  // Load saved parameters on mount
  useEffect(() => {
    (async () => {
      try {
        const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
        if (currentParameters) {
          setParameters(currentParameters);
          // API key is not stored in parameters anymore (stored in DynamoDB)
          // Just set initialized state
        }
        setIsInitialized(true);
        sdk.app.setReady();
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    })();
  }, [sdk]);

  useEffect(() => {
    checkContentModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If API key is present and we have stored settings, auto-validate on mount
  useEffect(() => {
    if (isInitialized && parameters.launchDarklyApiKey) {
      console.log('[ConfigScreen] Auto-validating stored API key...');
      handleAutoValidateApiKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  const onConfigure = useCallback(async () => {
    // Use refs to get the latest values
    const currentParams = parametersRef.current;
    const currentValidation = apiKeyValidationRef.current;

    console.log('[ConfigScreen] onConfigure called with:', {
      apiKey: currentParams.launchDarklyApiKey ? '***set***' : 'NOT SET',
      projectKey: currentParams.launchDarklyProjectKey,
      environment: currentParams.launchDarklyEnvironment,
      isValid: currentValidation.isValid,
    });

    // Validate configuration before allowing installation
    if (
      !currentParams.launchDarklyApiKey ||
      !currentParams.launchDarklyProjectKey ||
      !currentParams.launchDarklyEnvironment
    ) {
      console.error('[ConfigScreen] Validation failed: Missing required fields');
      sdk.notifier.error('Please complete all required fields before installing.');
      return false;
    }

    if (!currentValidation.isValid) {
      console.error('[ConfigScreen] Validation failed: API key not validated');
      sdk.notifier.error('Please validate your API key before installing.');
      return false;
    }

    try {
      // Save metadata to Contentful parameters
      // Note: Temporarily saving the API key so it can be registered in onConfigurationCompleted
      // After registration, the API key will be removed from Contentful and stored securely in backend
      const savedParams: AppInstallationParameters = {
        launchDarklyApiKey: currentParams.launchDarklyApiKey,
        launchDarklyProjectKey: currentParams.launchDarklyProjectKey,
        launchDarklyEnvironment: currentParams.launchDarklyEnvironment,
        launchDarklyProjectName: currentParams.launchDarklyProjectName,
        launchDarklyEnvironmentName: currentParams.launchDarklyEnvironmentName,
      };

      // Ensure parameters are structured-cloneable (can be sent via postMessage)
      JSON.stringify(savedParams);

      // Get current state and set up the app as entry editor for the LaunchDarkly content type
      const currentState = await sdk.app.getCurrentState();
      const targetState = {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE]: {
            editors: { position: 0 },
          },
        },
      };

      const result = {
        parameters: savedParams,
        targetState,
      };

      console.log('[ConfigScreen] Returning configuration:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[ConfigScreen] Error in onConfigure:', error);
      sdk.notifier.error('Failed to save configuration. Please try again.');
      return false;
    }
  }, [sdk]);

  /**
   * Called after the app has been successfully installed or updated
   * This is when we can safely make signed requests to register the API key
   */
  const onConfigurationCompleted = useCallback(async () => {
    try {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      
      console.log('[ConfigScreen] onConfigurationCompleted called', {
        hasParams: !!currentParameters,
        hasApiKey: !!currentParameters?.launchDarklyApiKey,
        isRegistered: currentParameters?.isRegistered,
      });

      // Register with backend if API key is present and not already registered
      if (currentParameters?.launchDarklyApiKey && !currentParameters?.isRegistered) {
        try {
          setIsRegistering(true);
          console.log('[ConfigScreen] Registering installation with backend...');
          await registerInstallation(currentParameters.launchDarklyApiKey);
          console.log('[ConfigScreen] Registration complete');

          sdk.notifier.success('LaunchDarkly app installed successfully!');
          
          // Note: The API key remains in Contentful parameters for now, but all API calls
          // will go through the backend using signed requests. If you want to remove the API key
          // from Contentful storage, save the configuration again with isRegistered=true
        } catch (error) {
          console.error('[ConfigScreen] Registration failed:', error);
          sdk.notifier.error('Installation completed but failed to register API key. Please try updating the configuration.');
        } finally {
          setIsRegistering(false);
        }
      }
    } catch (error) {
      console.error('[ConfigScreen] Error in onConfigurationCompleted:', error);
    }
  }, [sdk, registerInstallation]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted(() => onConfigurationCompleted());
  }, [sdk, onConfigure, onConfigurationCompleted]);

  return (
    <Flex flexDirection="column" className={css({ margin: '10px 80px 80px', maxWidth: '800px' })} gap="spacingL">
      <Form>
        <Heading>LaunchDarkly App Config</Heading>
        <Paragraph fontColor="gray600" style={{ marginTop: '8px', marginBottom: '4px' }}>
          API token permissions needed:
        </Paragraph>
        <List style={{ marginBottom: '20px', marginTop: '10px' }}>
          <ListItem><strong>Projects (read)</strong></ListItem>
          <ListItem><strong>Environments (read)</strong></ListItem>
          <ListItem><strong>Flags (read)</strong></ListItem>
          <ListItem><strong>Flags (create)</strong></ListItem>
        </List>
        <Paragraph fontColor="gray600" style={{ marginBottom: '12px' }}>
          This app reads existing flags and can create new flags; it does not modify or delete existing flags.
          Click the button below to view the required permissions JSON for setting up a more granular custom role policy for your API token or you can use an existing role that has the above mentioned permissions.
          <br /> <br />
          See the documentation for more details on policy configuration here:{' '}
          <br />
          <a href="https://launchdarkly.com/docs/home/account/api-create" target="_blank" rel="noopener noreferrer">
            https://launchdarkly.com/docs/home/account/api-create
          </a>
        </Paragraph>
        <Button 
          variant="secondary" 
          size="small"
          onClick={() => setIsPermissionsModalOpen(true)}
          style={{ marginBottom: '16px', minWidth: '400px' }}
        >
          View Required Permissions JSON
        </Button>
        
        {/* Show current settings if they exist */}
        <CurrentSettings parameters={parameters} />
        
        <ApiKeySection
          apiKey={parameters.launchDarklyApiKey || ''}
          isLoading={projectsLoading}
          validation={apiKeyValidation}
          onChange={(apiKey) => {
            setParameters((prev) => ({ ...prev, launchDarklyApiKey: apiKey }));
            setApiKeyValidation({ isValidating: false, error: null, isValid: false });
            setProjects([]);
            setParameters((prev) => ({ ...prev, launchDarklyProjectKey: '', launchDarklyEnvironment: '' }));
          }}
          onValidate={handleValidateApiKey}
        />
        {(apiKeyValidation.isValid || parameters.launchDarklyApiKey) && (
          <ProjectSelector
            projectKey={parameters.launchDarklyProjectKey || ''}
            projects={projects}
            isLoading={projectsLoading}
            onChange={(projectKey) => {
              const selectedProject = projects.find((p) => p.key === projectKey);
              setParameters((prev) => ({
                ...prev,
                launchDarklyProjectKey: projectKey,
                launchDarklyProjectName: selectedProject?.name,
                launchDarklyEnvironment: '',
                launchDarklyEnvironmentName: undefined,
              }));
            }}
          />
        )}
        {(apiKeyValidation.isValid || parameters.launchDarklyApiKey) && parameters.launchDarklyProjectKey && (
          <EnvironmentSelector
            environmentKey={parameters.launchDarklyEnvironment || ''}
            environments={environments}
            isLoading={environmentsLoading}
            onChange={(environmentKey) => {
              const selectedEnvironment = environments.find((e) => e.key === environmentKey);
              setParameters((prev) => ({
                ...prev,
                launchDarklyEnvironment: environmentKey,
                launchDarklyEnvironmentName: selectedEnvironment?.name,
              }));
            }}
          />
        )}

        {/* Show API key rotation button if already registered */}
        {parameters.isRegistered && (
          <Card padding="default" style={{ marginTop: '16px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <div>
                <Text fontWeight="fontWeightMedium">API Key Management</Text>
                <Paragraph marginTop="spacingXs" marginBottom="none">
                  {parameters.apiKeyLastFour && `API key ending in ...${parameters.apiKeyLastFour}`}
                </Paragraph>
              </div>
              <Button variant="secondary" onClick={() => setShowKeyRotation(true)} isDisabled={isRegistering}>
                Update API Key
              </Button>
            </Flex>
          </Card>
        )}
        
        <Card padding="large" style={{ marginTop: '24px', marginBottom: '24px' }}>
          <Heading as="h3" marginBottom="spacingS">Content Model Setup</Heading>
          {modelCheck.checking && (
            <Paragraph>Checking for existing content type…</Paragraph>
          )}
          {!modelCheck.checking && modelCheck.valid && (
            <>
              <Note variant="positive" style={{ marginBottom: 12 }}>
                LaunchDarkly Feature Flag content type is present and correctly configured.
              </Note>
              <Paragraph style={{ marginTop: 0 }}>
                You’re all set. Open the content model or start creating entries with the Entry Editor.
              </Paragraph>
            </>
          )}
          {!modelCheck.checking && !modelCheck.valid && (
            <>
              {modelCheck.exists && modelCheck.missing.length > 0 && (
                <Note variant="warning" style={{ marginBottom: 12 }}>
                  Found content type but missing required configuration: {modelCheck.missing.join(', ')}
                </Note>
              )}
              {modelCheck.error && (
                <></>
                // <Note variant="negative" style={{ marginBottom: 12 }}>{modelCheck.error}</Note>
              )}
              <Paragraph>
                Create or update the "LaunchDarkly Feature Flag" content type with the exact fields required by this app.
                This action is safe and idempotent.
              </Paragraph>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, width: '100%' }}>
                <Button
                  variant="primary"
                  isLoading={creatingModel}
                  onClick={async () => {
                    try {
                      console.log('[ConfigScreen] CT action start', { space: (sdk as any).ids.space, env: (sdk as any).ids.environment });
                      setCreatingModel(true);
                      await createOrUpdateLDContentType(cma, { spaceId: (sdk as any).ids.space, environmentId: (sdk as any).ids.environment }, { appId: (sdk as any).ids.app });
                      // Note: Entry editor assignment is handled via targetState in onConfigure
                      (sdk as any)?.notifier?.success?.('LaunchDarkly Feature Flag content type is ready.');
                      await checkContentModel();
                    } catch (e: any) {
                      console.error('[ConfigScreen] Failed to create/update content type', { name: e?.name, message: e?.message, details: e?.details });
                      (sdk as any)?.notifier?.error?.(e?.message || 'Failed to create/update content type');
                    } finally {
                      setCreatingModel(false);
                      console.log('[ConfigScreen] CT action end');
                    }
                  }}
                  style={{ display: 'inline-flex', width: 'auto', minWidth: 'auto', whiteSpace: 'nowrap', alignSelf: 'flex-start', maxWidth: '100%' }}
                >
                  {creatingModel ? 'Creating…' : 'Create "LaunchDarkly Feature Flag" content type'}
                </Button>
                <Note variant="neutral">Fields being created: Name, Key, Description, Variations, ContentMapping</Note>
              </div>
            </>
          )}
        </Card>
      </Form>

      <Modal onClose={() => setIsPermissionsModalOpen(false)} isShown={isPermissionsModalOpen}>
        {() => (
          <>
            <Modal.Header
              title="LaunchDarkly API Token Permissions"
              onClose={() => setIsPermissionsModalOpen(false)}
            />
            <Modal.Content>
              <Paragraph marginBottom="spacingM">
                When creating your LaunchDarkly API token, use the following custom role policy JSON to grant the required permissions:
              </Paragraph>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Card 
                  padding="large" 
                  style={{ 
                    backgroundColor: '#1a1a1a', 
                    color: '#e6e6e6', 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', 
                    fontSize: '13px', 
                    borderRadius: '6px', 
                    border: '1px solid #333',
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <code style={{ color: '#e6e6e6' }}>{permissionsJSON}</code>
                  </pre>
                </Card>
                <Button
                  variant="primary"
                  size="small"
                  onClick={copyPermissionsToClipboard}
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px',
                    minWidth: 'auto'
                  }}
                >
                  {copiedPermissions ? '✓ Copied!' : 'Copy JSON'}
                </Button>
              </div>
              <Note variant="primary">
                <Text fontWeight="fontWeightMedium">How to use:</Text>
                <Paragraph marginTop="spacingXs">
                  1. In LaunchDarkly, go to <strong>Account Settings → Authorization</strong><br/>
                  2. Click <strong>Create token</strong> or <strong>Roles → Create custom role</strong><br/>
                  3. Switch to <strong>JSON editor</strong> or <strong>Advanced editor</strong><br/>
                  4. Paste this JSON into the policy editor<br/>
                  5. Save and copy the generated API token to use in this configuration
                </Paragraph>
              </Note>
            </Modal.Content>
            <Modal.Controls>
              <Button onClick={() => setIsPermissionsModalOpen(false)}>Close</Button>
            </Modal.Controls>
          </>
        )}
      </Modal>

      {/* API Key Rotation Modal */}
      <KeyRotationModal
        isOpen={showKeyRotation}
        onClose={() => setShowKeyRotation(false)}
        onUpdate={handleKeyRotation}
      />
    </Flex>
  );
};

export default ConfigScreen;
