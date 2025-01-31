import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useSDK } from '@contentful/react-apps-toolkit';
import * as ApiClients from './../../../../src/app/lib/ApiClients';
import RoiConversion from '@/components/DashboardComps/ROIConversion/RoiConversion';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: jest.fn(),
}));

jest.mock('./../../../../src/app/lib/ApiClients', () => ({
  ApiClient: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

const mockStore = configureStore([]);

describe('RoiConversion', () => {
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
          totalContacts: 100,
          newContacts: 20,
          lastWeekCounts: [],
          lastYearCounts: [],
          topCities: [{ name: 'City A', count: 50, color: 'red', labelColor: 'black' }],
          topOrders: [{ Type: 'Order A', Date: '2023-01-01', count: 200 }],
          totalUsers: [{ Date: '2023-01-01', count: 500 }],
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
        <RoiConversion order={1} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(5);
    });
  });
});
