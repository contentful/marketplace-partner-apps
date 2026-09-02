import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSDK } from '@contentful/react-apps-toolkit';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AssetPickerButton } from './AssetPickerButton';
import { MediaLibraryResultAsset } from '../../types';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

const rawAsset = { public_id: 'foo/bar', resource_type: 'image' } as unknown as MediaLibraryResultAsset;

function createMockSdk(overrides: Record<string, unknown> = {}) {
  return {
    entry: {},
    notifier: { error: vi.fn() },
    dialogs: { openCurrentApp: vi.fn() },
    parameters: {
      instance: { resourceType: 'all', searchFilter: '' },
      installation: { showUploadButton: 'false', showAssetButtonOnly: 'false' },
    },
    ...overrides,
  };
}

describe('AssetPickerButton (single-asset field flow)', () => {
  let mockSdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  it('renders "Select an Image" and scopes the picker to images', async () => {
    mockSdk.parameters.instance.resourceType = 'image';
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(undefined);

    render(<AssetPickerButton onNewAssetsAdded={vi.fn()} isDisabled={false} />);

    await userEvent.click(screen.getByText('Select an Image'));

    const call = mockSdk.dialogs.openCurrentApp.mock.calls[0][0];
    expect(call.parameters.expression.trim()).toBe('resource_type:image');
  });

  it('renders "Select a Video" and scopes the picker to videos', async () => {
    mockSdk.parameters.instance.resourceType = 'video';
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(undefined);

    render(<AssetPickerButton onNewAssetsAdded={vi.fn()} isDisabled={false} />);

    await userEvent.click(screen.getByText('Select a Video'));

    const call = mockSdk.dialogs.openCurrentApp.mock.calls[0][0];
    expect(call.parameters.expression.trim()).toBe('resource_type:video');
  });

  it('opens an unscoped picker for resourceType "all" with showAssetButtonOnly', async () => {
    mockSdk.parameters.instance.resourceType = 'all';
    mockSdk.parameters.installation.showAssetButtonOnly = 'true';
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(undefined);

    render(<AssetPickerButton onNewAssetsAdded={vi.fn()} isDisabled={false} />);

    await userEvent.click(screen.getByText('Select an Asset'));

    const call = mockSdk.dialogs.openCurrentApp.mock.calls[0][0];
    expect(call.parameters).not.toHaveProperty('expression');
  });

  it('extracts and forwards picked assets to onNewAssetsAdded', async () => {
    mockSdk.parameters.instance.resourceType = 'image';
    mockSdk.dialogs.openCurrentApp.mockResolvedValue({ assets: [rawAsset] });
    const onNewAssetsAdded = vi.fn();

    render(<AssetPickerButton onNewAssetsAdded={onNewAssetsAdded} isDisabled={false} />);

    await userEvent.click(screen.getByText('Select an Image'));

    expect(onNewAssetsAdded).toHaveBeenCalledTimes(1);
    expect(onNewAssetsAdded.mock.calls[0][0]).toEqual([expect.objectContaining({ public_id: 'foo/bar' })]);
  });

  it('does not call onNewAssetsAdded when the dialog is cancelled', async () => {
    mockSdk.parameters.instance.resourceType = 'image';
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(undefined);
    const onNewAssetsAdded = vi.fn();

    render(<AssetPickerButton onNewAssetsAdded={onNewAssetsAdded} isDisabled={false} />);

    await userEvent.click(screen.getByText('Select an Image'));

    expect(onNewAssetsAdded).not.toHaveBeenCalled();
  });

  it('disables the button and blocks opening the dialog when isDisabled is true', async () => {
    mockSdk.parameters.instance.resourceType = 'image';

    render(<AssetPickerButton onNewAssetsAdded={vi.fn()} isDisabled={true} />);

    const button = screen.getByText('Select an Image').closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await userEvent.click(button);
    expect(mockSdk.dialogs.openCurrentApp).not.toHaveBeenCalled();
  });
});
