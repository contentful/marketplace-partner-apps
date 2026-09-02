import { render, screen } from '@testing-library/react';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Field from './index';
import { CloudinaryAsset } from '../../types';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useAutoResizer: vi.fn(),
  useFieldValue: vi.fn(),
  useSDK: vi.fn(),
}));

vi.mock('./AssetPickerButton', () => ({
  AssetPickerButton: ({ isDisabled, onNewAssetsAdded }: any) => (
    <button data-test-id="asset-picker-button" disabled={isDisabled} onClick={() => onNewAssetsAdded([{ public_id: 'new/asset' }])}>
      Select an Asset
    </button>
  ),
}));

const asset = { public_id: 'existing/asset' } as CloudinaryAsset;

function createMockSdk(overrides: Record<string, unknown> = {}) {
  return {
    field: {
      id: 'cloudinaryField',
      locale: 'en-US',
      getIsDisabled: vi.fn().mockReturnValue(false),
      onIsDisabledChanged: vi.fn(),
      removeValue: vi.fn(),
    },
    parameters: { installation: { maxFiles: 10 } },
    ...overrides,
  };
}

describe('Field (single-asset field flow)', () => {
  let mockSdk: ReturnType<typeof createMockSdk>;
  let setAssets: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk();
    setAssets = vi.fn();
    (useSDK as any).mockReturnValue(mockSdk);
    (useAutoResizer as any).mockReturnValue(undefined);
    (useFieldValue as any).mockReturnValue([[], setAssets]);
  });

  it('renders the picker button when no assets are set', () => {
    render(<Field />);
    expect(screen.getByTestId('asset-picker-button')).toBeTruthy();
  });

  it('does not render Thumbnails when there are no assets', () => {
    render(<Field />);
    expect(screen.queryByRole('img')).toBeFalsy();
  });

  it('enables the picker button while under maxFiles and editing is allowed', () => {
    (useFieldValue as any).mockReturnValue([[asset], setAssets]);
    render(<Field />);
    expect((screen.getByTestId('asset-picker-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables the picker button once maxFiles is reached', () => {
    mockSdk.parameters.installation.maxFiles = 1;
    (useFieldValue as any).mockReturnValue([[asset], setAssets]);
    render(<Field />);
    expect((screen.getByTestId('asset-picker-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables the picker button when the field is disabled', () => {
    mockSdk.field.getIsDisabled.mockReturnValue(true);
    render(<Field />);
    expect((screen.getByTestId('asset-picker-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('appends newly picked assets to the existing field value', async () => {
    (useFieldValue as any).mockReturnValue([[asset], setAssets]);
    render(<Field />);

    screen.getByTestId('asset-picker-button').click();

    expect(setAssets).toHaveBeenCalledWith([asset, { public_id: 'new/asset' }]);
  });

  it('sets assets from an empty field value when picking for the first time', () => {
    render(<Field />);

    screen.getByTestId('asset-picker-button').click();

    expect(setAssets).toHaveBeenCalledWith([{ public_id: 'new/asset' }]);
  });
});
