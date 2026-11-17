import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Form, FormControl, Heading, Note, Paragraph, Select, TextInput } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import { callAlchemer } from '../lib/alchemer';

export interface AppInstallationParameters {
  apiToken?: string;
  apiTokenSecret?: string;
  apiHost?: string;
}

// Keep in sync with ALLOWED_HOSTS in functions/alchemerProxy.ts and
// allowNetworks in contentful-app-manifest.json.
const API_HOSTS = [
  { value: 'api.alchemer.com', label: 'US (api.alchemer.com)' },
  { value: 'api.alchemer.eu', label: 'EU (api.alchemer.eu)' },
  { value: 'api.alchemer-ca.com', label: 'Canada (api.alchemer-ca.com)' },
  { value: 'api.au.alchemer.com', label: 'Australia (api.au.alchemer.com)' },
];

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiHost: API_HOSTS[0].value,
  });
  const [testing, setTesting] = useState(false);
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    if (!parameters.apiToken || !parameters.apiTokenSecret) {
      sdk.notifier.error('Enter both the Alchemer API token and API token secret.');
      // Returning false aborts the install/save.
      return false;
    }
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
      const current: AppInstallationParameters | null = await sdk.app.getParameters();
      if (current) {
        setParameters({ apiHost: API_HOSTS[0].value, ...current });
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  // Exercises the proxy function end to end with the SAVED parameters.
  // It cannot test unsaved edits: the function reads installation parameters
  // server-side, so the user must save first for new tokens to take effect.
  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await callAlchemer(sdk, { action: 'testConnection' });
      if (res.ok) {
        sdk.notifier.success(`Connected to Alchemer. ${res.totalCount ?? 0} surveys visible to this API key.`);
      } else {
        sdk.notifier.error(res.error);
      }
    } catch {
      // A rejection can mean the bundle/action are missing, but also that the
      // app simply is not installed here yet: action calls are scoped to an
      // app installation, so they 404 in a not-yet-installed environment.
      sdk.notifier.error(
        'Could not invoke the proxy function. Make sure the app is installed in this ' +
          'environment (Install button, top right), the app bundle is uploaded, and the ' +
          'alchemerApi app action exists (see README).'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Connect Alchemer</Heading>
        <Paragraph>
          This app lets editors pick an Alchemer survey in a JSON field. Requests to the Alchemer REST API are proxied through a Contentful app function because
          the API does not allow direct browser calls.
        </Paragraph>
        <Note variant="warning" className={css({ marginBottom: '1.5rem' })}>
          The credentials below are stored as app installation parameters, which are readable by users of this space. Use a dedicated Alchemer API key with the
          least privileges you can. In Alchemer, keys are managed under Account, then Integrations, then API Key (admins: Security, then API Access).
        </Note>
        <FormControl isRequired>
          <FormControl.Label>API token</FormControl.Label>
          <TextInput value={parameters.apiToken ?? ''} name="apiToken" onChange={(e) => setParameters((p) => ({ ...p, apiToken: e.target.value }))} />
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label>API token secret</FormControl.Label>
          <TextInput
            type="password"
            value={parameters.apiTokenSecret ?? ''}
            name="apiTokenSecret"
            onChange={(e) => setParameters((p) => ({ ...p, apiTokenSecret: e.target.value }))}
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>API region</FormControl.Label>
          <Select value={parameters.apiHost ?? API_HOSTS[0].value} onChange={(e) => setParameters((p) => ({ ...p, apiHost: e.target.value }))}>
            {API_HOSTS.map((h) => (
              <Select.Option key={h.value} value={h.value}>
                {h.label}
              </Select.Option>
            ))}
          </Select>
          <FormControl.HelpText>
            Must match where the Alchemer account is hosted; every request fails with a 401 &quot;Invalid api_token&quot; error otherwise.
          </FormControl.HelpText>
        </FormControl>
        <Button variant="secondary" onClick={() => void testConnection()} isDisabled={testing}>
          {testing ? 'Testing...' : 'Test connection (uses last saved credentials)'}
        </Button>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
