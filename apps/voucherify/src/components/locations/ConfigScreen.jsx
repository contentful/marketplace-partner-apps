import {Button, Form, FormControl, GlobalStyles, Heading, Paragraph, TextInput} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import { verifyKeys } from '../../api/verifyKeys';
import { CUSTOM_URL_PATTERN } from '../../contentful-constants';
import voucherifyLogo from '../../assets/voucherify-logo.svg'
import tokens from '@contentful/f36-tokens';

const styles = {
    body: css({
        height: 'auto',
        minHeight: '65vh',
        margin: '0 auto',
        marginTop: tokens.spacingXl,
        padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
        maxWidth: tokens.contentWidthText,
        backgroundColor: tokens.colorWhite,
        borderRadius: '8px',
        border: `1px solid ${tokens.gray300}`,
    }),
    splitter: css({
        marginTop: tokens.spacingL,
        marginBottom: tokens.spacingL,
        border: 0,
        height: '1px',
        backgroundColor: tokens.gray300,
    }),
    logo: css({
        display: 'flex',
        justifyContent: 'center',
        '> img': {
            display: 'block',
            width: '70px',
            margin: `${tokens.spacingXl} 0`,
        },
    }),
};

const ConfigScreen = () => {
  const sdk = useSDK();
  const [credentials, setCredentials] = useState({});

  const validateIfCredentialsExist = (credentials) => {
    if (!credentials.appId || !credentials.secretKey || !credentials.customURL) {
      throw new Error('Please fill in all fields.');
    }
  };

  const verifyVoucherifyKeys = useCallback(async () => {
    const areCredentialsCorrect = await verifyKeys(credentials.appId, credentials.secretKey, credentials.customURL);
    if (areCredentialsCorrect) {
      sdk.notifier.success('The provided Voucherify credentials and custom URL are correct.');
    }
  }, [credentials, sdk.notifier]);

  const handleKeysVerification = async () => {
    try {
      validateIfCredentialsExist(credentials);
      validateCustomURL();
      await verifyVoucherifyKeys(credentials.appId, credentials.secretKey);
    } catch (error) {
      sdk.notifier.error(error.message);
    }
  };

  const validateCustomURL = () => {
    if (credentials.customURL) {
      const isCustomURLValid = typeof credentials.customURL === 'string' && CUSTOM_URL_PATTERN.test(credentials.customURL);

      if (!isCustomURLValid) {
        throw new Error(`The Custom URL: ${credentials.customURL} is invalid. It probably lacks the HTTP/HTTPS protocol or has an incorrect format.`);
      }
    }
  };

  const configureAppParameters = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    await verifyVoucherifyKeys();
    try {
      validateIfCredentialsExist(credentials);
      await sdk.app.setReady();
      return {
        parameters: { credentials },
        targetState: currentState,
      };
    } catch (error) {
      sdk.notifier.error(error.message);
      throw error;
    }
  }, [credentials, sdk, verifyVoucherifyKeys]);

  const onAppIdChange = (e) => {
    setCredentials({ ...credentials, appId: e.target.value });
  };

  const onSecretKeyChange = (e) => {
    setCredentials({ ...credentials, secretKey: e.target.value });
  };

  const onCustomURLChange = (e) => {
    setCredentials({ ...credentials, customURL: e.target.value });
  };

  useEffect(() => {
    sdk.app.onConfigure(() => configureAppParameters());
  }, [sdk, configureAppParameters]);

  useEffect(() => {
    (async () => {
      const currentAppParameters = await sdk.app.getParameters();
      if (currentAppParameters) {
        setCredentials(currentAppParameters.credentials);
      }
      await sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <>
      <GlobalStyles />
        <div className={styles.body}>
            <Heading>About Voucherify</Heading>
            <Paragraph>Voucherify empowers marketers and developers with flexible building blocks to implement, manage, and track targeted promotional campaigns at any scale.</Paragraph>
            <hr className={styles.splitter} />
        <Form className={css({ padding: '20px 40px' })} onSubmit={handleKeysVerification}>
          <Heading>Application Configuration</Heading>
          <FormControl>
            <FormControl.Label>Application ID</FormControl.Label>
            <TextInput className={css({ width: '50%', marginRight: '20px' })} value={credentials?.appId || ''} onChange={onAppIdChange} />
          </FormControl>
          <FormControl>
            <FormControl.Label>Secret Key</FormControl.Label>
            <TextInput
              className={css({ width: '50%', marginRight: '20px' })}
              value={credentials?.secretKey || ''}
              onChange={onSecretKeyChange}
              type="password"
            />
          </FormControl>
          <FormControl>
            <FormControl.Label>Custom URL</FormControl.Label>
            <TextInput className={css({ width: '50%', marginRight: '20px' })} value={credentials?.customURL || ''} onChange={onCustomURLChange} type="text" />
          </FormControl>
          <Button variant="secondary" type="submit">
            {' '}
            Verify Credentials
          </Button>
        </Form>
        </div>
        <div className={styles.logo}>
            <img src={voucherifyLogo} alt="Voucherify Logo" />
        </div>
    </>
  );
};

export default ConfigScreen;
