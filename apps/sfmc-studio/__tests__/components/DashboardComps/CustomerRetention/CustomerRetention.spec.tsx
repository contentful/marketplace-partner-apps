import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useSDK } from '@contentful/react-apps-toolkit';
import CustomerRetention from './../../../../src/app/components/DashboardComps/CustomerRetention/CustomerRetention';
import * as ApiClients from './../../../../src/app/lib/ApiClients';

// Mock modules
jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: jest.fn(),
}));

jest.mock('./../../../../src/app/lib/ApiClients', () => ({
  ApiClient: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

// Setup mock store
const mockStore = configureStore([]);

describe('CustomerRetention', () => {
  let store: ReturnType<typeof mockStore>;
  let initialState: any;
  let mockPost: jest.Mock;

  beforeEach(() => {
    initialState = {
      dateSlice: {
        dateRange: {
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T23:59:59.999Z',
        },
      },
      navigationSlice: {
        activeRoute: {
          order: 1,
        },
      },
      loaderSlice: {},
      themeSlice: {
        theme: 'light',
      },
      authSlice: {
        isAuth: true,
      },
    };
    store = mockStore(initialState);

    (useSDK as jest.Mock).mockReturnValue({
      parameters: {
        installation: {
          licenseKey: 'mock-license-key',
          sfscTimezone: 'UTC',
        },
      },
    });

    mockPost = jest.fn().mockResolvedValue({
      data: {
        data: {
          totalAmount: { count: 1000, currency: 'USD' },
          averageOrderValue: { count: 50, currency: 'USD' },
          totalOrders: { count: 200 },
          newClients: { count: 30 },
          revenueBySource: [],
          orderByStatus: [],
          topProductRevenue: [],
          topProductSku: [],
          topProductFamily: [],
          soldProducts: [],
        },
      },
      status: 200,
    });

    (ApiClients.ApiClient as jest.Mock).mockReturnValue({
      post: mockPost,
    });
  });

  it('fetches and sets data correctly on mount', async () => {
    render(
      <Provider store={store}>
        <CustomerRetention order={1} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(7);
    });
  });
});
