import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useSDK } from '@contentful/react-apps-toolkit';
import CustomerEngagement from './../../../../src/app/components/DashboardComps/CustomerEngagement/CustomerEngagement';
import * as ApiClients from './../../../../src/app/lib/ApiClients';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: jest.fn(),
}));

jest.mock('./../../../../src/app/lib/ApiClients', () => ({
  ApiClient: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

const mockStore = configureStore([]);

describe('CustomerEngagement', () => {
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
        isTwentyFourHr: false,
      },
      navigationSlice: {
        activeRoute: {
          order: 1,
        },
      },
      loadersSlice: {},
      authSlice: {
        isAuth: true,
      },
    };
    store = mockStore(initialState);
    (useSDK as jest.Mock).mockReturnValue({
      parameters: {
        installation: {
          licenseKey: 'mock-license-key',
          sfmcTimezone: 'UTC',
        },
      },
    });

    mockPost = jest.fn().mockResolvedValue({
      data: {
        data: [
          { count: { count: 100, change: 10 }, cardText: 'Total Deliveries' },
          { count: { count: 50, change: 5 }, cardText: 'Total Opens' },
          // add more mock data here as needed
        ],
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
        <CustomerEngagement order={1} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(11); // Adjust the number based on API calls made in the component
    });

    // Add assertions to check if the fetched data is rendered correctly
    expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
    expect(screen.getByText('Total Opens')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockPost.mockRejectedValue(new Error('API Error'));

    render(
      <Provider store={store}>
        <CustomerEngagement order={1} />
      </Provider>,
    );

    await waitFor(() => {});

    // Ensure that the component renders something even if there's an error
    expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
  });
});
