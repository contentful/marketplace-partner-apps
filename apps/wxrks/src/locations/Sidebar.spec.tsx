import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import bwxApi from '../api/api';
import Sidebar from './Sidebar';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useCMA: jest.fn(),
  useSDK: jest.fn(),
}));

jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    checkAuth: jest.fn(),
    getProgress: jest.fn(),
  },
}));

jest.mock('../components/BwxCreateProject', () => ({
  __esModule: true,
  default: () => <div data-testid="create-project" />,
}));

jest.mock('../components/BwxFetchTranslations', () => ({
  __esModule: true,
  default: () => <div data-testid="fetch-translations" />,
}));

jest.mock('../components/TMUpdates', () => ({
  __esModule: true,
  default: () => <div data-testid="tm-updates" />,
}));

const ERROR_MESSAGE = 'Failed to load status in wxrks. Please try again later.';

const mockedUseSDK = useSDK as jest.MockedFunction<() => unknown>;
const mockedUseCMA = useCMA as jest.MockedFunction<() => unknown>;
const mockedBwxApi = bwxApi as unknown as jest.Mocked<Pick<typeof bwxApi, 'checkAuth' | 'getProgress'>>;

const sidebarSdk = {
  window: {
    startAutoResizer: jest.fn(),
  },
  ids: {
    entry: 'entry-id',
  },
  locales: {
    names: {
      'en-US': 'English',
    },
  },
};

const configSdk = {
  ids: {
    space: 'space-id',
  },
  parameters: {
    installation: {},
  },
};

const cma = {};

const createJsonResponse = (data: unknown) => ({
  json: jest.fn().mockResolvedValue(data),
});

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

describe('Sidebar', () => {
  let sdkCallCount: number;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    sdkCallCount = 0;

    mockedUseSDK.mockImplementation(() => {
      const sdk = sdkCallCount % 2 === 0 ? configSdk : sidebarSdk;
      sdkCallCount += 1;
      return sdk;
    });
    mockedUseCMA.mockReturnValue(cma);
    mockedBwxApi.checkAuth.mockResolvedValue(true);
    mockedBwxApi.getProgress.mockResolvedValue(createJsonResponse({ status: 'NOT_FOUND' }));
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('does not show the error note while the initial auth check is loading', async () => {
    const authCheck = createDeferred<true | undefined>();
    mockedBwxApi.checkAuth.mockReturnValue(authCheck.promise);

    render(<Sidebar />);

    expect(screen.getByText('Loading wxrks App')).toBeInTheDocument();
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();

    await act(async () => {
      authCheck.resolve(undefined);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading wxrks App')).not.toBeInTheDocument();
    });
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it('renders the loaded translation status after successful initialization', async () => {
    mockedBwxApi.getProgress.mockResolvedValue(
      createJsonResponse({
        status: 'COMPLETED',
        entriesProgress: [{ language: 'en-US', progress: 1 }],
      })
    );

    render(<Sidebar />);

    expect(await screen.findByText('Translation Status')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTestId('fetch-translations')).toBeInTheDocument();
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it('shows the error note and retry action when initialization fails', async () => {
    mockedBwxApi.checkAuth.mockRejectedValue(new Error('Invalid credentials'));

    render(<Sidebar />);

    expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(mockedBwxApi.getProgress).not.toHaveBeenCalled();
  });
});
