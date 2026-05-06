import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { OembedMetadata } from '../oembed';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('../oembed', () => ({
  getExperienceMetadata: vi.fn(),
}));

import { useSDK } from '@contentful/react-apps-toolkit';
import { getExperienceMetadata } from '../oembed';
import Entry from './EntryEditor';

const mockGetExperienceMetadata = vi.mocked(getExperienceMetadata);
const mockUseSDK = vi.mocked(useSDK);

const baseParameters = {
  contentTypeId: 'cerosExperience',
  titleFieldId: 'title',
  urlFieldId: 'url',
  embedCodeFieldId: 'embedCode',
};

const CEROS_EMBED_CODE = '<div class="ceros-experience" style="aspect-ratio:4/3">https://view.ceros.com/account/experience</div>';

const makeMockSdk = (overrides: Record<string, any> = {}) => ({
  parameters: {
    installation: baseParameters,
    ...overrides.parameters,
  },
  entry: {
    fields: {
      title: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
      url: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
      embedCode: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
    },
    save: vi.fn().mockResolvedValue({}),
    getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: 'cerosExperience' } } }),
    ...overrides.entry,
  },
  ...overrides,
});

const makeLinkedSdk = (embedCode: string, title = 'My Experience') => {
  const sdk = makeMockSdk();
  sdk.entry.fields.title.getValue.mockReturnValue(title);
  sdk.entry.fields.embedCode.getValue.mockReturnValue(embedCode);
  return sdk;
};

describe('Entry — configuration errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a config error when installation parameters are missing', async () => {
    mockUseSDK.mockReturnValue({
      parameters: {
        installation: { contentTypeId: '', titleFieldId: '', urlFieldId: '', embedCodeFieldId: '' },
      },
      entry: {
        fields: {},
        save: vi.fn(),
        getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: '' } } }),
      },
    } as any);

    render(<Entry />);

    expect(screen.getByText(/isn't fully configured/i)).toBeInTheDocument();
  });

  it('shows a content type error when the entry content type does not match', async () => {
    mockUseSDK.mockReturnValue(
      makeMockSdk({
        entry: {
          fields: {
            title: { getValue: vi.fn().mockReturnValue('') },
            url: { getValue: vi.fn().mockReturnValue('') },
            embedCode: { getValue: vi.fn().mockReturnValue('') },
          },
          save: vi.fn(),
          getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: 'somethingElse' } } }),
        },
      }) as any,
    );

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText(/isn't configured to use the Ceros app/i)).toBeInTheDocument();
    });
  });
});

describe('Entry — EmptyState (no linked experience)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSDK.mockReturnValue(makeMockSdk() as any);
  });

  it('renders the URL input form', async () => {
    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/https:\/\/account\.ceros\.site\//i)).toBeInTheDocument();
    });
  });

  it('renders the Link Experience button', async () => {
    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText('Link Experience')).toBeInTheDocument();
    });
  });

  it('shows a validation error when getExperienceMetadata returns null', async () => {
    mockGetExperienceMetadata.mockResolvedValue(null);

    render(<Entry />);

    const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i);
    fireEvent.change(input, { target: { value: 'https://invalid.url' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/The experience URL is invalid/i)).toBeInTheDocument();
    });
  });

  it('calls getExperienceMetadata with the entered URL on submit', async () => {
    mockGetExperienceMetadata.mockResolvedValue(null);

    render(<Entry />);

    const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i);
    fireEvent.change(input, { target: { value: 'https://view.ceros.com/account/experience' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockGetExperienceMetadata).toHaveBeenCalledWith('https://view.ceros.com/account/experience');
    });
  });

  it('saves title, url, and embed code to entry fields on successful metadata fetch', async () => {
    const sdk = makeMockSdk();
    mockUseSDK.mockReturnValue(sdk as any);

    const mockMetadata: OembedMetadata = {
      type: 'rich',
      url: 'https://view.ceros.com/account/experience',
      title: 'My Experience',
      html: CEROS_EMBED_CODE,
      width: 800,
      height: 600,
      provider_name: 'Ceros',
      provider_url: 'https://ceros.com',
      version: '1.0',
      embedType: 'full-height',
    };
    mockGetExperienceMetadata.mockResolvedValue(mockMetadata);

    render(<Entry />);

    const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i);
    fireEvent.change(input, { target: { value: 'https://view.ceros.com/account/experience' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(sdk.entry.fields.title.setValue).toHaveBeenCalledWith('My Experience');
      expect(sdk.entry.fields.url.setValue).toHaveBeenCalledWith('https://view.ceros.com/account/experience');
      expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(CEROS_EMBED_CODE);
    });
  });

  it('calls entry.save() after setting field values', async () => {
    const sdk = makeMockSdk();
    mockUseSDK.mockReturnValue(sdk as any);

    mockGetExperienceMetadata.mockResolvedValue({
      type: 'rich',
      url: 'https://view.ceros.com/account/experience',
      title: 'Test',
      html: CEROS_EMBED_CODE,
      width: 800,
      height: 600,
      provider_name: 'Ceros',
      provider_url: 'https://ceros.com',
      version: '1.0',
      embedType: 'full-height',
    });

    render(<Entry />);

    const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i);
    fireEvent.change(input, { target: { value: 'https://view.ceros.com/account/experience' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(sdk.entry.save).toHaveBeenCalled();
    });
  });
});

describe('Entry — LinkedState (experience linked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the Ceros experience preview for a valid Ceros view.ceros.com embed code', async () => {
    mockUseSDK.mockReturnValue(makeLinkedSdk(CEROS_EMBED_CODE) as any);

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText(/A Ceros experience is linked/i)).toBeInTheDocument();
    });
  });

  it('shows the Ceros experience preview for a *.ceros.site embed code', async () => {
    const cerosSiteEmbedCode = '<div>https://myaccount.ceros.site/experience</div>';
    mockUseSDK.mockReturnValue(makeLinkedSdk(cerosSiteEmbedCode) as any);

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText(/A Ceros experience is linked/i)).toBeInTheDocument();
    });
  });

  it('shows a warning for non-Ceros embed code', async () => {
    const nonCerosEmbed = '<iframe src="https://example.com/embed"></iframe>';
    mockUseSDK.mockReturnValue(makeLinkedSdk(nonCerosEmbed) as any);

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText(/doesn't look like a Ceros experience/i)).toBeInTheDocument();
    });
  });

  it('shows a warning when embed code has ceros-experience class but no view.ceros.com URL', async () => {
    const partialEmbed = '<div class="ceros-experience">https://example.com/something</div>';
    mockUseSDK.mockReturnValue(makeLinkedSdk(partialEmbed) as any);

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText(/doesn't look like a Ceros experience/i)).toBeInTheDocument();
    });
  });

  it('renders the Refresh Embed Code button for Ceros experiences', async () => {
    mockUseSDK.mockReturnValue(makeLinkedSdk(CEROS_EMBED_CODE) as any);

    render(<Entry />);

    await waitFor(() => {
      expect(screen.getByText('Refresh Embed Code')).toBeInTheDocument();
    });
  });

  it('clears all entry fields when unlinking', async () => {
    const sdk = makeLinkedSdk(CEROS_EMBED_CODE);
    mockUseSDK.mockReturnValue(sdk as any);

    render(<Entry />);

    const unlinkButton = await screen.findByText('Unlink Experience');
    fireEvent.submit(unlinkButton.closest('form')!);

    await waitFor(() => {
      expect(sdk.entry.fields.title.removeValue).toHaveBeenCalled();
      expect(sdk.entry.fields.url.removeValue).toHaveBeenCalled();
      expect(sdk.entry.fields.embedCode.removeValue).toHaveBeenCalled();
    });
  });

  it('shows an error note when refresh fails', async () => {
    const sdk = makeLinkedSdk(CEROS_EMBED_CODE);
    sdk.entry.fields.url.getValue.mockReturnValue('https://view.ceros.com/account/experience');
    mockUseSDK.mockReturnValue(sdk as any);
    mockGetExperienceMetadata.mockResolvedValue(null);

    render(<Entry />);

    const refreshButton = await screen.findByText('Refresh Embed Code');
    fireEvent.submit(refreshButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/There was an error refreshing the embed code/i)).toBeInTheDocument();
    });
  });

  it('updates the embed code field when refresh succeeds', async () => {
    const sdk = makeLinkedSdk(CEROS_EMBED_CODE);
    sdk.entry.fields.url.getValue.mockReturnValue('https://view.ceros.com/account/experience');
    mockUseSDK.mockReturnValue(sdk as any);

    const freshEmbed = '<div class="ceros-experience">https://view.ceros.com/account/experience-updated</div>';
    mockGetExperienceMetadata.mockResolvedValue({
      type: 'rich',
      url: 'https://view.ceros.com/account/experience',
      title: 'My Experience',
      html: freshEmbed,
      width: 800,
      height: 600,
      provider_name: 'Ceros',
      provider_url: 'https://ceros.com',
      version: '1.0',
      embedType: 'full-height',
    });

    render(<Entry />);

    const refreshButton = await screen.findByText('Refresh Embed Code');
    fireEvent.submit(refreshButton.closest('form')!);

    await waitFor(() => {
      expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(freshEmbed);
    });
  });
});
