import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSDK } from '@contentful/react-apps-toolkit';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

function createMockSdk(overrides: Record<string, unknown> = {}) {
  return {
    ids: { app: 'cloudinary-app' },
    entry: {
      getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: 'ct1' } } }),
      fields: {} as Record<string, { getValue: (locale: string) => unknown; setValue: (value: unknown, locale: string) => Promise<unknown> }>,
    },
    cma: {
      editorInterface: {
        get: vi.fn().mockResolvedValue({
          controls: [{ fieldId: 'gallery', widgetNamespace: 'app', widgetId: 'cloudinary-app' }],
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [{ id: 'gallery', name: 'Gallery', localized: false }],
        }),
      },
    },
    locales: { names: { 'en-US': 'English' } as Record<string, string>, default: 'en-US' },
    editor: { getLocaleSettings: vi.fn().mockReturnValue({ active: ['en-US'] }) },
    parameters: { installation: { maxFiles: 10 } },
    dialogs: { openCurrentApp: vi.fn() },
    notifier: { error: vi.fn() },
    ...overrides,
  };
}

describe('Sidebar (multi-asset field-selection flow)', () => {
  let mockSdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  it('shows a message when no fields use the Cloudinary app', async () => {
    (mockSdk.cma.editorInterface.get as any).mockResolvedValue({ controls: [] });

    render(<Sidebar />);

    await waitFor(() => expect(screen.getByText('No Cloudinary fields found in this content type.')).toBeTruthy());
  });

  it('builds one slot per non-localized field using the default locale', async () => {
    render(<Sidebar />);

    await waitFor(() => expect(screen.getByText('Open Cloudinary')).toBeTruthy());
    expect(screen.getByText(/1 field, 1 locale/)).toBeTruthy();
  });

  it('builds one slot per active locale for a localized field', async () => {
    (mockSdk.cma.contentType.get as any).mockResolvedValue({
      fields: [{ id: 'gallery', name: 'Gallery', localized: true }],
    });
    mockSdk.locales = { names: { 'en-US': 'English', 'de-DE': 'German' }, default: 'en-US' };
    (mockSdk.editor.getLocaleSettings as any).mockReturnValue({ active: ['en-US', 'de-DE'] });

    render(<Sidebar />);

    await waitFor(() => expect(screen.getByText(/1 field, 2 locales/)).toBeTruthy());
  });

  it('opens the multi-field dialog with one slot per field/locale and applies returned assignments', async () => {
    mockSdk.entry.fields = { gallery: { getValue: vi.fn().mockReturnValue([]), setValue: vi.fn() } };
    (mockSdk.dialogs.openCurrentApp as any).mockResolvedValue({
      mode: 'multi-field',
      assignments: { 'gallery::en-US': [{ public_id: 'picked/one' }] },
    });

    render(<Sidebar />);
    await waitFor(() => expect(screen.getByText('Open Cloudinary')).toBeTruthy());

    await userEvent.click(screen.getByText('Open Cloudinary'));

    await waitFor(() => expect(mockSdk.entry.fields.gallery.setValue).toHaveBeenCalled());
    const [value, locale] = (mockSdk.entry.fields.gallery.setValue as any).mock.calls[0];
    expect(locale).toBe('en-US');
    expect(value).toEqual([expect.objectContaining({ public_id: 'picked/one' })]);
  });

  it('merges newly assigned assets with existing field values, capped at maxFiles', async () => {
    mockSdk.entry.fields = {
      gallery: { getValue: vi.fn().mockReturnValue([{ public_id: 'existing' }]), setValue: vi.fn() },
    };
    mockSdk.parameters.installation.maxFiles = 1;
    (mockSdk.dialogs.openCurrentApp as any).mockResolvedValue({
      mode: 'multi-field',
      assignments: { 'gallery::en-US': [{ public_id: 'new-one' }] },
    });

    render(<Sidebar />);
    await waitFor(() => expect(screen.getByText('Open Cloudinary')).toBeTruthy());

    await userEvent.click(screen.getByText('Open Cloudinary'));

    await waitFor(() => expect(mockSdk.entry.fields.gallery.setValue).toHaveBeenCalled());
    const [value] = (mockSdk.entry.fields.gallery.setValue as any).mock.calls[0];
    expect(value).toHaveLength(1);
    expect(value[0]).toEqual(expect.objectContaining({ public_id: 'existing' }));
  });

  it('does not touch any field when the dialog is cancelled', async () => {
    mockSdk.entry.fields = { gallery: { getValue: vi.fn().mockReturnValue([]), setValue: vi.fn() } };
    (mockSdk.dialogs.openCurrentApp as any).mockResolvedValue(undefined);

    render(<Sidebar />);
    await waitFor(() => expect(screen.getByText('Open Cloudinary')).toBeTruthy());

    await userEvent.click(screen.getByText('Open Cloudinary'));

    await waitFor(() => expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalled());
    expect(mockSdk.entry.fields.gallery.setValue).not.toHaveBeenCalled();
  });
});
