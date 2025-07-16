import React, {useEffect, useState, useCallback} from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import EntryEditor from './locations/EntryEditor';
import Sidebar from './locations/Sidebar';
import tokens from '@contentful/f36-tokens';
import { Modal, Flex, Heading, Paragraph, FormControl, TextInput, TextLink, Button } from '@contentful/f36-components';
import { css } from 'emotion';
import { validateCredentials } from './utils';

const styles = {
  formItem: css({
    marginTop: tokens.spacingXs
  }),
  connectButton: css({
    width: '100%'
  })
}

const App = (props) => {
  const [loading, setLoading] = useState(false);
  const [state,setState] = useState({
    accessToken: props.sdk.parameters.installation.accessToken || '',
    showAuth: false,
    accountId: props.sdk.parameters.installation.accountId || ''
  });
  

  const openAuth = useCallback(() => {
    setState(prevState => ({ ...prevState, showAuth: true }));
  }, []);

  const validateUserCredentials = useCallback(async (props) => {
    const apiToken = props.sdk.parameters.installation.accessToken;
    const vwoAccountId = props.sdk.parameters.installation.accountId;

    if(vwoAccountId && apiToken){
      setState({
        accessToken: apiToken,
        accountId: vwoAccountId,
        showAuth: false
      });
    }
  }, [openAuth]);

  const updateCredentials = useCallback((credentials) => {
    if (!credentials.token || !credentials.accountId){
      return;
    }
    setState({
      accessToken: credentials.token,
      accountId: credentials.accountId,
      showAuth: false
    });
  }, [openAuth]);

  const connectToVwo = useCallback(async () => {
    setLoading(true);
    const areCredentialsValid = await validateCredentials(state.accountId, state.accessToken);
    if(areCredentialsValid?.code === 200){
      updateCredentials({
        accountId: state.accountId,
        token: state.accessToken
      });
      props.sdk.notifier.success("Successfully connected to VWO.");
    }
    else{
      props.sdk.notifier.error("Something went wrong. Please check the credentials properly and try again.");
    }
    setLoading(false)
    return areCredentialsValid;
  }, [state.accountId, state.accessToken, props.sdk.notifier, updateCredentials]);

  const updateAccountId = useCallback((value) => {
    setState(prevState => ({ ...prevState, accountId: value }));
  }, []);

  const updateAuthToken = useCallback((value) => {
    setState(prevState => ({ ...prevState, accessToken: value }));
  }, []);

  useEffect(() => {
    validateUserCredentials(props);
  }, [validateUserCredentials, props]);

  if(state.showAuth){
    return <Modal isShown={true}>
      <Flex flexDirection='column'>
        <Heading marginBottom='spacingXl'>Configuration</Heading>
        <FormControl className={styles.formItem}>
            <FormControl.Label isRequired>Account ID</FormControl.Label>
            <TextInput
              value={state.accountId}
              onChange={(e) => updateAccountId(e.target.value)}/>
        </FormControl>
        <FormControl className={styles.formItem}>
            <FormControl.Label isRequired>API Key</FormControl.Label>
            <TextInput
              value={state.accessToken}
              onChange={(e) => updateAuthToken(e.target.value)}/>
        </FormControl>
        <Paragraph>You can find the auth token in Integrations &gt; Contentful &gt; Config section in VWO app. For more details, <TextLink href='https://help.vwo.com/hc/en-us/articles/40825355345177-Integrating-VWO-Feature-Flags-with-Contentful-CMS' target='_blank' rel="noopener noreferrer">click here.</TextLink></Paragraph>
        <Paragraph>Please note that this token would have read-only(browse) level permissions to your organization level information stored in VWO, which can be accessed via API calls by any user in the current Contentful space.</Paragraph>
        <Flex alignItems='center' justifyContent='center'>
          <Button variant='primary' className={styles.connectButton} onClick={connectToVwo} isLoading={loading}>Connect with VWO</Button>
        </Flex>
      </Flex>
    </Modal>
  }

  // Perform conditional rendering based on location
  if (props.sdk.location.is(locations.LOCATION_ENTRY_EDITOR)) {
    return <EntryEditor sdk={props.sdk} openAuth={openAuth} />
  } else if (props.sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    return <Sidebar sdk={props.sdk}/>;
  }

  // Handle other locations here...
  if (props.sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return (
      <ConfigScreen
        openAuth={openAuth}
        accessToken={state.accessToken}
        accountId={state.accountId}
        updateCredentials={updateCredentials}
        sdk={props.sdk}
      />
    );
  }

  return null;
};

export default App;