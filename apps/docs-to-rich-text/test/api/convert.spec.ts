import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { convert } from '../../src/api/convert';
import { uploadImageFromUrl } from '../../src/utils/assetUpload';
import { CreateImageWrapperEntry } from '../../src/utils/entryUpload';
import axios from 'axios';

// Mock external modules and functions
vi.mock('axios');
vi.mock('../../src/assetUtil', () => ({
  uploadImageFromUrl: vi.fn(),
}));
vi.mock('../../src/entryUtil', () => ({
  CreateImageWrapperEntry: vi.fn(),
}));

describe('convert', () => {
  let mockSdk: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup a mock SDK object with required properties
    mockSdk = {
      ids: {
        space: 'testSpaceId',
        environment: 'testEnvironmentId',
      },
      parameters: {
        installation: {
          useImageWrapper: true,
        },
      },
      cma: {},
    };

    // Mock axios response with correct typing for TypeScript
    (axios.post as Mock).mockResolvedValue({
      data: {
        images: [
          {
            assetUrl: 'http://example.com/image1.png',
            assetAlt: 'Image 1',
            assetId: 'asset1',
            contentWrapperId: 'wrapper1',
          },
          {
            assetUrl: 'http://example.com/image2.png',
            assetAlt: 'Image 2',
            assetId: 'asset2',
          },
        ],
        richText: '<p>Converted HTML content</p>',
      },
    });
  });

  it('should make a POST request to the conversion API with the correct parameters', async () => {
    const htmlInput = '<p>Sample HTML</p>';

    await convert(htmlInput, mockSdk);

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.ellavationlabs.com/api/rtf/convert',
      {
        spaceId: mockSdk.ids.space,
        html: htmlInput,
        useWrapper: mockSdk.parameters.installation.useImageWrapper,
      }
    );
  });
});
