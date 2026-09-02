import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSDK } from '@contentful/react-apps-toolkit';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AssetPickerDialog from './AssetPickerDialog';
import { loadScript } from '../utils';
import { PickerSlot } from './Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('../utils', () => ({
  loadScript: vi.fn().mockResolvedValue(undefined),
  extractAsset: vi.fn((a) => a),
  mediaLibraryFilter: vi.fn(),
}));

/**
 * `createMediaLibrary` is captured so each test can drive the widget's
 * `insertHandler` exactly like the real Cloudinary script would.
 */
let createMediaLibraryMock: ReturnType<typeof vi.fn>;
let capturedCallbacks: { insertHandler: (data: any) => void } | undefined;

function createMockSdk(invocationParams: Record<string, unknown>) {
  return {
    close: vi.fn(),
    window: { updateHeight: vi.fn() },
    parameters: {
      invocation: invocationParams,
      installation: {
        cloudName: 'demo',
        apiKey: 'key',
        maxFiles: 10,
        format: 'none',
        quality: 'none',
        showUploadButton: 'true',
        startFolder: '',
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedCallbacks = undefined;

  createMediaLibraryMock = vi.fn((_options, callbacks) => {
    capturedCallbacks = callbacks;
    return { show: vi.fn() };
  });

  (window as any).cloudinary = { createMediaLibrary: createMediaLibraryMock };
});

describe('AssetPickerDialog router', () => {
  it('renders the single-field widget when invocation params carry no mode', async () => {
    (useSDK as any).mockReturnValue(createMockSdk({ expression: 'resource_type:image' }));

    render(<AssetPickerDialog />);

    await waitFor(() => expect(loadScript).toHaveBeenCalled());
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Add to field:')).toBeFalsy();
  });

  it('renders the multi-field toolbar when invocation params request multi-field mode', async () => {
    const slots: PickerSlot[] = [{ slotKey: 'a::en-US', fieldId: 'a', fieldName: 'A', locale: 'en-US', localeName: 'English', maxFiles: 10 }];
    (useSDK as any).mockReturnValue(createMockSdk({ mode: 'multi-field', slots }));

    render(<AssetPickerDialog />);

    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Add to field:')).toBeTruthy();
  });
});

describe('AssetPickerDialog single-field mode (single-asset picker flow)', () => {
  it('closes the dialog directly with the widget result — no slot routing', async () => {
    const sdk = createMockSdk({ expression: 'resource_type:image' });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    const widgetResult = { assets: [{ public_id: 'picked/one' }], mlId: 'ml-1' };
    capturedCallbacks!.insertHandler(widgetResult);

    expect(sdk.close).toHaveBeenCalledWith(widgetResult);
  });

  it('passes the search expression from invocation params through to the widget options', async () => {
    const sdk = createMockSdk({ expression: 'resource_type:video' });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    const options = createMediaLibraryMock.mock.calls[0][0];
    expect(options.search).toEqual({ expression: 'resource_type:video' });
  });

  it('overrides installation maxFiles with an invocation-level maxFiles', async () => {
    const sdk = createMockSdk({ maxFiles: 1 });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    const options = createMediaLibraryMock.mock.calls[0][0];
    expect(options.max_files).toBe(1);
    expect(options.multiple).toBe(false);
  });

  it('falls back to installation maxFiles when invocation params omit it', async () => {
    const sdk = createMockSdk({});
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    const options = createMediaLibraryMock.mock.calls[0][0];
    expect(options.max_files).toBe(10);
    expect(options.multiple).toBe(true);
  });
});

describe('AssetPickerDialog multi-field mode (multi-asset sidebar flow)', () => {
  const slots: PickerSlot[] = [
    { slotKey: 'fieldA::en-US', fieldId: 'fieldA', fieldName: 'Field A', locale: 'en-US', localeName: 'English', maxFiles: 2 },
    { slotKey: 'fieldB::en-US', fieldId: 'fieldB', fieldName: 'Field B', locale: 'en-US', localeName: 'English', maxFiles: 1 },
  ];

  it('routes a picked asset to the active slot instead of closing the dialog', async () => {
    const sdk = createMockSdk({ mode: 'multi-field', slots });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    act(() => {
      capturedCallbacks!.insertHandler({ assets: [{ public_id: 'picked/one' }], mlId: 'ml-1' });
    });

    expect(sdk.close).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/Add to entry \(1\)/)).toBeTruthy());

    await userEvent.click(screen.getByRole('button', { name: /Field/ }));
    expect(screen.getByText(/Field A — English \(1\)/)).toBeTruthy();
  });

  it('auto-advances to the next slot with remaining capacity', async () => {
    const sdk = createMockSdk({ mode: 'multi-field', slots });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    act(() => {
      capturedCallbacks!.insertHandler({ assets: [{ public_id: 'a' }, { public_id: 'b' }], mlId: 'ml-1' });
    });

    await waitFor(() => expect(screen.getByText(/Field B — English/)).toBeTruthy());
  });

  it('closes with all per-slot assignments when "Add to entry" is clicked', async () => {
    const sdk = createMockSdk({ mode: 'multi-field', slots });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    act(() => {
      capturedCallbacks!.insertHandler({ assets: [{ public_id: 'picked/one' }], mlId: 'ml-1' });
    });
    await waitFor(() => expect(screen.getByText(/Add to entry \(1\)/)).toBeTruthy());

    await userEvent.click(screen.getByText(/Add to entry/));

    expect(sdk.close).toHaveBeenCalledWith({
      mode: 'multi-field',
      assignments: {
        'fieldA::en-US': [{ public_id: 'picked/one' }],
        'fieldB::en-US': [],
      },
    });
  });

  it('closes with undefined when Cancel is clicked', async () => {
    const sdk = createMockSdk({ mode: 'multi-field', slots });
    (useSDK as any).mockReturnValue(sdk);

    render(<AssetPickerDialog />);
    await waitFor(() => expect(createMediaLibraryMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByText('Cancel'));

    expect(sdk.close).toHaveBeenCalledWith(undefined);
  });
});
