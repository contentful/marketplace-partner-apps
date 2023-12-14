import React from 'react';
import ReactDOM from 'react-dom';
import { init, locations } from 'contentful-ui-extensions-sdk';
import { SidebarExtension } from './sidebar';
import { DialogExtension } from './dialog';
import { AppConfig } from './app-config';
import '@contentful/forma-36-fcss/dist/styles.css';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

require('dotenv').config();

init(sdk => {
  if (sdk.window) {
    sdk.window.startAutoResizer();
  }
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    ReactDOM.render(<AppConfig sdk={sdk} />, document.getElementById('root'));
    return;
  }
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    ReactDOM.render(<DialogExtension sdk={sdk} />, document.getElementById('root'));
    return;
  }
  ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
});
