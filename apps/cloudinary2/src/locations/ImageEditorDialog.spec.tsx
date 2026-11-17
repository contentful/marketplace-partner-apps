import { render, waitFor } from '@testing-library/react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImageEditorDialog from './ImageEditorDialog';
import { CloudinaryAsset } from '../types';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>();
  return { ...actual, loadScript: vi.fn().mockResolvedValue(undefined) };
});

const editedAsset: CloudinaryAsset = {
  url: 'http://static.example.com/image/upload/c_crop,h_2160,w_2160,x_1187,y_0/c_scale,h_2160,w_2160/f_auto/q_auto/v1/bike',
  secure_url: 'https://static.example.com/image/upload/c_crop,h_2160,w_2160,x_1187,y_0/c_scale,h_2160,w_2160/f_auto/q_auto/v1/bike',
  original_url: 'http://static.example.com/image/upload/f_auto/q_auto/bike',
  original_secure_url: 'https://static.example.com/image/upload/f_auto/q_auto/bike',
  raw_transformation: 'c_crop,h_2160,w_2160,x_1187,y_0/c_scale,h_2160,w_2160/f_auto/q_auto',
  tags: [],
  type: 'upload',
  bytes: 1,
  width: 2160,
  format: 'jpg',
  height: 2160,
  version: 1,
  duration: null,
  metadata: [],
  public_id: 'bike',
  created_at: '2026-11-11T00:00:00Z',
  resource_type: 'image',
};

describe('ImageEditorDialog', () => {
  const editor = { update: vi.fn(), show: vi.fn(), on: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    window.cloudinary = { mediaEditor: vi.fn(() => editor) } as unknown as typeof window.cloudinary;
    (useSDK as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      window: { updateHeight: vi.fn() },
      close: vi.fn(),
      parameters: {
        installation: { cloudName: 'demo', apiKey: 'key', format: 'auto', quality: 'auto', imageEditorOverlays: [] },
        invocation: { asset: editedAsset },
      },
    });
  });

  it('does not feed a previous edit back into the editor when re-editing an asset', async () => {
    render(<ImageEditorDialog />);

    await waitFor(() => expect(editor.update).toHaveBeenCalled());

    const config = editor.update.mock.calls[0][0];
    // The Media Editor appends image.transformation after its own crop, so a previous
    // pixel crop would be applied to the wrong dimensions ("Invalid crop coordinates").
    expect(config.image.transformation).toEqual([{ rawTransformation: 'f_auto/q_auto' }]);
    expect(config.publicIds).toEqual(['bike']);
  });
});
