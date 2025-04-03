import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RightLayout from './../../src/app/components/Layout/RightLayout';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    parameters: {
      installation: {
        companyName: 'Mock Company',
        companyLogoUrl: '/mock/logo.png',
        licenseKey: 'mockLicenseKey',
      },
    },
    ids: { space: 'mockSpaceId' },
  }),
}));

jest.mock('./../../src/app/lib/utils/icons', () => ({
  ArrowRightHeader: '<svg></svg>',
  ArrowLeftHeader: '<svg></svg>',
  PenIcon: '<svg></svg>',
  SyncIcon: '<svg></svg>',
  HelpIcon: '<svg aria-label="Help"></svg>',
  ExportReportIcon: '<svg></svg>',
}));

const mockStore = configureStore([]);
const initialState = {
  loaderSlice: { loading: false },
  themeSlice: { theme: 'light' },
  navigationSlice: {
    activeRoute: { heading: 'Mock Heading', _id: 'mockId', order: 1 },
  },
  authSlice: { isAuth: true },
};
const store = mockStore(initialState);

jest.mock('./../lib/ApiClients.spec', () => ({
  ApiClient: () => ({
    post: jest.fn().mockResolvedValue({ data: { data: { automatedSync: true } }, status: 200 }),
  }),
}));

describe('RightLayout', () => {
  it('should render RightLayout and handle interactions', () => {
    render(
      <Provider store={store}>
        <RightLayout collapsed={false} setCollapsed={jest.fn()} />
      </Provider>,
    );

    screen.debug();

    expect(screen.getByText('Mock Heading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sync/i }));
  });
});
