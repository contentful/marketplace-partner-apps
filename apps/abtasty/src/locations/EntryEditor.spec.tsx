import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EntryEditor from './EntryEditor';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

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

const { getMeQueryOptions } = await import('@/queries/getMeQueryOptions');
const { getVariationsOptions } = await import('@/queries/getVariationsOptions');

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
          // Ajout du content_types pour éviter l'écran "Configuration incomplète"
          content_types: [
            {
              id: 'abTastyContainer',
              referenceField: [],
            },
          ],
        },
      },
      ids: {
        space: 'space_123',
        environment: 'env_789',
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
        openAppConfig: vi.fn(),
        openEntry: vi.fn(),
      },
      locales: {
        default: 'en-US',
      },
      // Mocks CMA nécessaires pour la requête des content types et résumés d'entrées
      cma: {
        contentType: {
          get: vi.fn().mockResolvedValue({
            sys: { id: 'abTastyContainer' },
            name: 'AB Tasty Container',
          }),
          getMany: vi.fn().mockResolvedValue({ items: [] }),
        },
        entry: {
          get: vi.fn().mockResolvedValue({
            sys: { id: 'some-entry', contentType: { sys: { id: 'abTastyContainer' } } },
            fields: { name: { 'en-US': 'Sample Entry' } },
          }),
        },
      },
      notifier: {
        success: vi.fn(),
      },
    };

    cmaMock = {};

    // Par défaut, on garde l'état "loading" pour les variations afin d'éviter tout appel réel
    (getVariationsOptions as any).mockReturnValue({
      queryKey: ['variations', 'cmp_123', 'vg_1'],
      queryFn: () => new Promise(() => {}), // reste en chargement
    });
  });

  it('renders the heading Experiments', async () => {
    // Mock getMeQueryOptions pour retourner un utilisateur défini
    (getMeQueryOptions as any).mockReturnValue({
      queryKey: ['me'],
      queryFn: () => Promise.resolve({
        id: 'id_user',
        first_name: 'John',
        email: 'test@gma.com',
        last_name: 'doe',
      }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
    );

    

    const { findByText } = render(<EntryEditor />, { wrapper });
    expect(await findByText('Experiments')).toBeInTheDocument();
  });

  it('displays login prompt when user is undefined', async () => {
    (getMeQueryOptions as any).mockReturnValue({
      queryKey: ['me'],
      queryFn: () => Promise.resolve(undefined),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
    );

    const { findByText } = render(<EntryEditor />, { wrapper });
    // Texte actuel dans le composant: "You’re not signed in to AB Tasty"
    // On matche de façon robuste l’apostrophe droite ou typographique
    expect(await findByText(/You.?re not signed in to AB Tasty/i)).toBeInTheDocument();
  });
});
