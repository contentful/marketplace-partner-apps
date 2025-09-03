import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigScreen from '@/locations/ConfigScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let sdkMock: any;
let cmaMock: any;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdkMock,
  useCMA: () => cmaMock,
}));

vi.mock('@/components/EditorConfigForm', () => {
  const React = require('react');
  return {
    EditorConfigForm: ({ onCampaignSelect }: any) => {
      React.useEffect(() => {
        onCampaignSelect({
          id: 'cmp_123',
          name: 'TEST ContentFull',
          variation_id: 'vg_1',
        });
      }, [onCampaignSelect]);
      return <div data-testid="editor-config-form" />;
    },
  };
});

vi.mock('@/queries/getMeQueryOptions', () => ({
  getMeQueryOptions: vi.fn(),
}));

vi.mock('@/queries/getVariationsOptions', () => ({
  getVariationsOptions: vi.fn(),
}));

vi.mock('@/queries/getAccountByUserOptions', () => ({
  getAccountByUserOptions: vi.fn(),
}));

const { getMeQueryOptions } = await import('@/queries/getMeQueryOptions');
const { getVariationsOptions } = await import('@/queries/getVariationsOptions');
const { getAccountByUserOptions } = await import('@/queries/getAccountByUserOptions');

describe('Entry component', () => {
  beforeEach(() => {
    sdkMock = {
      parameters: {
        installation: {
          user_id: '123',
          abtasty_token: 'abcdef123456',
          flagship_account: {
            account_id: 'acc_456',
            account_name: 'Test Account',
          },
          flagship_env: {
            id: 'env_789',
            name: 'Production',
          },
        },
      },
      ids: {
        space: 'space_123',
        environment: 'env_789',
      },
      cma: {
        contentType: {
          getMany: vi.fn().mockResolvedValue({
            items: [
              { sys: { id: 'blogPost' }, name: 'Blog Post' },
              { sys: { id: 'page' }, name: 'Page' },
            ],
          }),
        },
        editorInterface: {
          get: vi.fn().mockResolvedValue({}),
        },
      },
      entry: {
        fields: {
          meta: { getValue: vi.fn(), setValue: vi.fn() },
          experimentID: { setValue: vi.fn() },
          experimentName: { setValue: vi.fn() },
          environmentId: { setValue: vi.fn() },
          environment: { setValue: vi.fn() },
          variations: { getValue: vi.fn(), setValue: vi.fn() },
        },
      },
      dialogs: {
        selectSingleEntry: vi.fn().mockResolvedValue({ sys: { id: 'entry123' } }),
      },
      navigator: {
        openNewEntry: vi.fn().mockResolvedValue({ entity: { sys: { id: 'entry456' } } }),
      },
      locales: {
        default: 'en-US',
      },
      app: {
        getParameters: vi.fn().mockResolvedValue(null),
        setReady: vi.fn(),
        onConfigurationCompleted: vi.fn(),
        onConfigure: vi.fn(),
        getCurrentState: vi.fn().mockResolvedValue({}),
      },
    };

    cmaMock = {};

    (getVariationsOptions as any).mockReturnValue({
      queryKey: ['variations', 'cmp_123', 'vg_1'],
      queryFn: () => new Promise(() => {}),
    });
  });

  it('display the login screen when user is not configured', async () => {
    (getMeQueryOptions as any).mockReturnValue({
      queryKey: ['me'],
      queryFn: () => Promise.resolve(undefined),
    });
    (getAccountByUserOptions as any).mockReturnValue({
      queryKey: ['accounts'],
      queryFn: () => Promise.resolve([]),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<ConfigScreen />, { wrapper });

    expect(await screen.findByText('Connect to ABTasty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login with AB Tasty/i })).toBeInTheDocument();
  });

  it('display the welcome message when user and account are loaded', async () => {
    sdkMock.app.getParameters.mockResolvedValue({ abtasty_token: 'tok123' });

    (getMeQueryOptions as any).mockReturnValue({
      queryKey: ['me'],
      queryFn: () =>
        Promise.resolve({
          id: 'u1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
        }),
    });

    (getAccountByUserOptions as any).mockReturnValue({
      queryKey: ['accounts', 'u1'],
      queryFn: () =>
        Promise.resolve([
          {
            account_id: 'acc_1',
            account_name: 'Main Account',
            account_environments: [
              { id: 'env_1', environment: 'Production' },
              { id: 'env_2', environment: 'Staging' },
            ],
          },
        ]),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<ConfigScreen />, { wrapper });

    expect(await screen.findByText('Welcome, John Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
  });
  
});