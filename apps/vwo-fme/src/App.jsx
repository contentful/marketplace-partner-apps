import React, {useEffect, useState, useCallback} from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import EntryEditor from './locations/EntryEditor';
import Sidebar from './locations/Sidebar';


const App = (props) => {
  const [state,setState] = useState({
    accessToken: props.sdk.parameters.installation.accessToken || '',
    accountId: props.sdk.parameters.installation.accountId || ''
  });

  const validateUserCredentials = useCallback(async (props) => {
    const apiToken = props.sdk.parameters.installation.accessToken;
    const vwoAccountId = props.sdk.parameters.installation.accountId;

    if(vwoAccountId && apiToken){
      setState({
        accessToken: apiToken,
        accountId: vwoAccountId,
      });
    }
  }, []);

  const updateCredentials = useCallback((credentials) => {
    if (!credentials.token || !credentials.accountId){
      return;
    }
    setState({
      accessToken: credentials.token,
      accountId: credentials.accountId,
    });
  }, []);

  useEffect(() => {
    validateUserCredentials(props);
  }, [validateUserCredentials, props]);

  // Perform conditional rendering based on location
  if (props.sdk.location.is(locations.LOCATION_ENTRY_EDITOR)) {
    return <EntryEditor sdk={props.sdk} />
  } else if (props.sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    return <Sidebar sdk={props.sdk}/>;
  }

  // Handle other locations here...
  if (props.sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return (
      <ConfigScreen
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