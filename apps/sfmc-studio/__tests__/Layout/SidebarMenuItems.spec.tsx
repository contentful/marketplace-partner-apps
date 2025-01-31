import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SidebarMenuItems from './../../src/app/components/Layout/SidebarMenuItems';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// Mock Contentful hooks
jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    parameters: {
      installation: {
        companyName: 'Mock Company',
        companyLogoUrl: '/mock/logo.png',
      },
    },
    ids: { space: 'mockSpaceId' },
  }),
  useCMA: () => ({}),
}));

const mockStore = configureStore([]);
const initialState = {
  loaderSlice: { loading: false },
  themeSlice: { theme: 'light' },
  navigationSlice: {
    menu: [
      { key: '1', label: 'Item 1', icon: JSON.stringify('icon1') },
      { key: '2', label: 'Item 2', icon: JSON.stringify('icon2') },
      { key: '3', label: 'Item 3', icon: JSON.stringify('icon3') },
    ],
    activeRoute: {},
  },
};
const store = mockStore(initialState);

describe('SidebarMenuItems', () => {
  it('should render SidebarMenuItems', () => {
    render(
      <Provider store={store}>
        <SidebarMenuItems collapsed={false} />
      </Provider>,
    );

    expect(screen.getByTestId('sidebar-menu-items')).toBeInTheDocument();
  });
});
