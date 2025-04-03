import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ConfigScreen, { validateLicenseKeyForWebApp } from '@/components/Locations/ConfigScreen';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ApiClient } from '@/lib/ApiClients';
import { encryptData, saveOrValidateLicenseKey } from '@/lib/utils/common';
import { AxiosInstance } from 'axios';
import { appInstallationParameters } from '@/lib/AppConfig';

// Mock the necessary libraries and hooks
jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: jest.fn(),
}));

jest.mock('../../src/app/lib/ApiClients', () => ({
  ApiClient: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

const automationConfigure: jest.Mock = jest.fn();
const userConfig = jest.fn();
const clearCacheApiCall = jest.fn();
const setClientCredsCookie = jest.fn();

jest.mock('../../src/app/lib/utils/common', () => ({
  CookieHelpers: {
    setCookie: jest.fn(),
    getCookie: jest.fn(),
    deleteCookie: jest.fn(),
  },
  saveOrValidateLicenseKey: jest.fn(),
  encryptData: jest.fn(),
  timeZoneMapping: [{ iana: 'Europe/London', name: 'London' }],
  clientCredsCookieName: 'clientCredsCookie',
}));

describe('ConfigScreen', () => {
  let mockSdk: any;
  let mockClient: any;

  beforeEach(() => {
    mockSdk = {
      app: {
        onConfigure: jest.fn(),
        getCurrentState: jest.fn(),
        getParameters: jest.fn(),
        setReady: jest.fn(),
      },
      ids: { space: 'spaceId' },
    };

    mockClient = {
      post: jest.fn(),
    };

    (useSDK as jest.Mock).mockReturnValue(mockSdk);
    (ApiClient as jest.Mock).mockReturnValue(mockClient);
    (encryptData as jest.Mock).mockImplementation((data) => JSON.stringify(data));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders ConfigScreen with initial parameters', async () => {
    mockSdk.app.getParameters.mockResolvedValue(appInstallationParameters);

    render(<ConfigScreen />);

    expect(screen.getByLabelText(/App License Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Logo Url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFMC Sub-domain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFMC MID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFMC Client Id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFMC Client Secret/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFMC Timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC Client Id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC Client Secret/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SFSC Timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Automated Sync/i)).toBeInTheDocument();
  });

  it('updates parameters on input change', async () => {
    mockSdk.app.getParameters.mockResolvedValue(appInstallationParameters);

    render(<ConfigScreen />);

    const licenseKeyInput = screen.getByLabelText(/App License Key/i);
    fireEvent.change(licenseKeyInput, { target: { value: 'new-license-key' } });

    expect(licenseKeyInput).toHaveValue('new-license-key');
  });

  it('handles Switch change correctly', async () => {
    mockSdk.app.getParameters.mockResolvedValue(appInstallationParameters);

    render(<ConfigScreen />);

    const switchElement = screen.getByRole('switch', { name: /Automated Sync/i });
    fireEvent.click(switchElement);

    expect(mockSdk.app.getParameters).toHaveBeenCalled();
  });

  it('should call validateLicenseKeyForWebApp with correct parameters when licenseKey is provided', async () => {
    const licenseKey = 'valid-license-key';
    (saveOrValidateLicenseKey as jest.Mock).mockResolvedValue({ success: true });

    await validateLicenseKeyForWebApp({ licenseKey }, mockSdk, mockClient);

    expect(saveOrValidateLicenseKey).toHaveBeenCalledWith(licenseKey, mockSdk.ids.space, mockClient);
  });

  it('should handle errors and log message when saveOrValidateLicenseKey throws an error', async () => {
    const licenseKey = 'invalid-license-key';
    (saveOrValidateLicenseKey as jest.Mock).mockRejectedValue(new Error('Invalid key'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await validateLicenseKeyForWebApp({ licenseKey }, mockSdk, mockClient);

    expect(consoleSpy).toHaveBeenCalledWith('License Key already exists/invalid');
    consoleSpy.mockRestore();
  });

  it('should not call saveOrValidateLicenseKey if licenseKey is not provided', async () => {
    const licenseKey = null;
    await validateLicenseKeyForWebApp({ licenseKey }, mockSdk, mockClient);

    expect(saveOrValidateLicenseKey).not.toHaveBeenCalled();
  });

  it('should call clearCacheApiCall with correct parameters', async () => {
    const licenseKey = 'test-license-key';
    mockClient.post.mockResolvedValue({ status: 200 });

    act(async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          '/api/clearCache',
          { licenseKey: encryptData({ licenseKey: licenseKey }) },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ['jro34134ecr4aex']: `${encryptData({ validate: Date.now(), token: process.env.NEXT_PUBLIC_JWT_TOKEN })}`,
            },
          },
        );
      });
    });
  });

  it('should call automationConfigure with correct parameters', async () => {
    const parameters = {
      licenseKey: 'test-license-key',
      sfmcDomain: 'test-domain',
      sfmcMarketingId: 'test-mid',
      sfmcclientId: 'test-client-id',
      sfmcclientSecret: 'test-client-secret',
    };
    mockClient.post.mockResolvedValue({ status: 200 });

    act(async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          '/api/automation',
          {
            subdomain: parameters.sfmcDomain,
            client_id: parameters.sfmcclientId,
            client_secret: encryptData({ sfmcclientSecret: parameters.sfmcclientSecret }),
            mid: parameters.sfmcMarketingId,
            licenseKey: encryptData({ licenseKey: parameters.licenseKey }),
            spaceId: mockSdk.ids.space,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ['jro34134ecr4aex']: `${encryptData({ validate: Date.now(), token: process.env.NEXT_PUBLIC_JWT_TOKEN })}`,
            },
          },
        );
      });
    });
  });

  it('should call userConfig with correct parameters', async () => {
    const parameters = {
      licenseKey: 'test-license-key',
      sfmcSync: true,
      sfmcMarketingId: 'test-mid',
      sfmcDomain: 'test-domain',
      sfmcclientId: 'test-client-id',
      sfmcclientSecret: 'test-client-secret',
      sfmcTimezone: 'Europe/London',
      sfscUrl: 'test-url',
      sfscclientId: 'test-client-id',
      sfscclientSecret: 'test-client-secret',
      sfscUsername: 'test-username',
      sfscPassword: 'test-password',
      sfscTimezone: 'Europe/London',
    };
    mockClient.post.mockResolvedValue({ status: 200 });

    act(async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          '/api/user-config',
          {
            automatedSync: parameters.sfmcSync,
            licenseKey: encryptData({ licenseKey: parameters.licenseKey }),
            spaceId: mockSdk.ids.space,
            marketingCred: {
              mId: parameters.sfmcMarketingId,
              subdomain: parameters.sfmcDomain,
              client_id: parameters.sfmcclientId,
              client_secret: encryptData({ sfmcclientSecret: parameters.sfmcclientSecret }),
              timezone: parameters.sfmcTimezone,
            },
            serviceCred: {
              url: parameters.sfscUrl,
              client_id: parameters.sfscclientId,
              client_secret: encryptData({ sfscclientSecret: parameters.sfscclientSecret }),
              username: parameters.sfscUsername,
              password: encryptData({ sfscPassword: parameters.sfscPassword }),
              timezone: parameters.sfscTimezone,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ['jro34134ecr4aex']: `${encryptData({ validate: Date.now(), token: process.env.NEXT_PUBLIC_JWT_TOKEN })}`,
            },
          },
        );
      });
    });
  });
});
