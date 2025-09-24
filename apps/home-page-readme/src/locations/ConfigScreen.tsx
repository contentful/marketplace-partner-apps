import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Heading, Paragraph, Button, Note, Spinner } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback, useEffect, useState } from 'react';
import { checkForReadmeType, createReadmeType } from '../utils/contentful';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [isChecking, setIsChecking] = useState(true);
  const [readmeExists, setReadmeExists] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const sdk = useSDK<ConfigAppSDK>();
  const cma: CMAClient = useCMA();

  const checkReadmeContentType = useCallback(async () => {
    setIsChecking(true);
    try {
      const exists = await checkForReadmeType(cma);
      setReadmeExists(exists);
    } catch (e) {
      setReadmeExists(false);
    } finally {
      setIsChecking(false);
    }
  }, [cma]);

  const handleCreateReadmeContentType = async () => {
    setCreating(true);
    try {
      await createReadmeType(cma);
      sdk.notifier.success('README content type created!');
      setReadmeExists(true);
    } catch (e) {
      sdk.notifier.error('Failed to create README content type.');
      console.error('Error creating README content type:', e);
    } finally {
      setCreating(false);
    }
  };

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
    checkReadmeContentType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Making sure everything is set to use the Readme app</Heading>
        <Paragraph>
          This app needs a <b>README</b> content type with <b>Title</b> (Symbol) and <b>ReadMe</b> (Text) fields. If you don't have one yet, just hit the button
          below!
        </Paragraph>
        {isChecking ? (
          <Flex alignItems="center" gap="spacingS">
            <Spinner size="medium" />
            <Paragraph>Checking for README content type...</Paragraph>
          </Flex>
        ) : readmeExists ? (
          <Note variant="positive" title="All set!">
            README content type exists.
          </Note>
        ) : (
          <Flex flexDirection="column" gap="spacingM">
            <Note variant="warning" title="README content type missing">
              The README content type does not exist in this space.
            </Note>
            <Button variant="primary" isLoading={creating} onClick={handleCreateReadmeContentType} isDisabled={creating}>
              Create README Content Type
            </Button>
          </Flex>
        )}
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
