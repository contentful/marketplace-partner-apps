import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import './index.scss';

import App from './App';

const root = document.getElementById('root');

render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
  root,
);
