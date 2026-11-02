import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Asset, RasterPickerProps } from '@raster-app/react';
import { expect, vi, beforeEach } from 'vitest';
import Dialog from '../Dialog';
import { toImage } from '../../lib/image';
import { mockDialog, storedImage } from '../../../test/mocks';

const useAutoResizer = vi.fn();

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockDialog,
  useAutoResizer: () => useAutoResizer(),
}));

const picked = {
  id: '2',
  parentId: null,
  name: 'Lisbon Tram',
  description: null,
  url: 'https://example.com/tram.jpg',
  contentType: 'image/jpeg',
  sizes: null,
  width: 1200,
  height: 800,
  blurhash: null,
  contentVersion: null,
  variants: null,
} as Asset;

let pickerProps: RasterPickerProps;

// Stands in for Raster's picker, which is tested in the SDK.
vi.mock('@raster-app/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@raster-app/react')>()),
  RasterPicker: (props: RasterPickerProps) => {
    pickerProps = props;
    return (
      <>
        <button type="button" onClick={() => props.onPick?.(picked, 'org-id')}>
          Pick asset
        </button>
        <button type="button" onClick={() => props.onPick?.({ ...picked, id: '3', contentType: 'video/mp4' }, 'org-id')}>
          Pick video
        </button>
        <button type="button" onClick={() => props.onPick?.({ ...picked, id: '4', contentType: null }, 'org-id')}>
          Pick untyped
        </button>
        <button type="button" onClick={() => props.onPick?.({ ...picked, id: '5', url: null }, 'org-id')}>
          Pick unprocessed
        </button>
      </>
    );
  },
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.mocked(mockDialog.close).mockReset();
    render(<Dialog />);
  });

  it('sizes the dialog to its content', () => {
    expect(useAutoResizer).toHaveBeenCalled();
  });

  it('opens the picker on the installation’s organization and key', () => {
    expect(pickerProps).toMatchObject({ organizationId: 'org-id', apiKey: 'api-key' });
  });

  it('starts from the field’s images', () => {
    expect(screen.getByRole('img', { name: 'Barcelona Beach' })).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('adds a picked asset once, and confirms the selection in order', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pick asset' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pick asset' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockDialog.close).toHaveBeenCalledWith([storedImage, toImage(picked)]);
  });

  it.each([
    ['Pick video', 'Only images can be used in this field.'],
    ['Pick untyped', 'Raster has no file type for this asset, so this field cannot take it.'],
    ['Pick unprocessed', 'Raster has no file for this asset yet.'],
  ])('says why it refuses an asset: %s', async (button, reason) => {
    await userEvent.click(screen.getByRole('button', { name: button }));

    expect(mockDialog.notifier.warning).toHaveBeenCalledWith(reason);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('removes an image from the selection', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Remove image' }));

    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('closes without changing the field on Cancel', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockDialog.close).toHaveBeenCalledWith();
  });
});
