import React from 'react';
import PropTypes from 'prop-types';

import { LiltClient } from './lilt';
import EMCDialog from './emc-dialog';

export class AppConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      liltConnectorToken: '',
      isLiltUser: false
    };

    this.onConfigure = this.onConfigure.bind(this);
    this.handleToken = this.handleToken.bind(this);
  }

  handleToken(token, isLiltUser = false) {
    this.setState({ liltConnectorToken: token, isLiltUser });
  }

  async onConfigure() {
    const { sdk } = this.props;
    const { liltApiKey, liltApiUrl, contentfulApiKey, liltConnectorToken, isLiltUser } = this.state;
    const parameters = {
      liltApiKey,
      liltApiUrl,
      contentfulApiKey,
      liltConnectorToken,
      isLiltUser
    };

    const { items } = await sdk.space.getContentTypes();
    const contentTypeIds = items.map(ct => ct.sys.id);
    const targetState = {
      EditorInterface: contentTypeIds.reduce((acc, id) => {
        // Insert the app as the first item in sidebars
        // of all content types.
        return { ...acc, [id]: { sidebar: { position: 0 } } };
      }, {})
    };
    return { parameters, targetState };
  }

  async componentDidMount() {
    const { sdk } = this.props;
    let parameters = await sdk.app.getParameters();
    if (!parameters) {
      parameters = {};
    }
    const { liltApiKey, liltApiUrl, contentfulApiKey, liltConnectorToken, isLiltUser } = parameters;
    const newState = {};

    if (liltApiKey) {
      newState.liltApiKey = liltApiKey;
    }
    if (liltApiUrl) {
      newState.liltApiUrl = liltApiUrl;
    }
    if (contentfulApiKey) {
      newState.contentfulApiKey = contentfulApiKey;
    }
    if (liltConnectorToken) {
      newState.liltConnectorToken = liltConnectorToken;
    }
    if (isLiltUser) {
      newState.isLiltUser = isLiltUser;
    }

    newState.lilt = new LiltClient(newState.liltApiUrl, newState.liltApiKey);

    this.setState(newState, () => {
      sdk.app.onConfigure(this.onConfigure);
      sdk.app.setReady();
    });
  }

  render() {
    const { sdk } = this.props;
    const { liltConnectorToken, isLiltUser } = this.state;

    if (liltConnectorToken) {
      return (
        <section className="app-config f36-padding--m">
          <p>
            You have successfully signed into your {isLiltUser ? 'Lilt' : 'Contentful'} account.
            Please click <b>Save</b> in the upper right-hand corner to continue.
          </p>
        </section>
      );
    }

    return <EMCDialog sdk={sdk} activeComponent="signIn" handleToken={this.handleToken} />;
  }
}

AppConfig.propTypes = {
  sdk: PropTypes.object.isRequired
};
