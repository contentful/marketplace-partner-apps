import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { convert } from '../../src/api/convert';
import { uploadImageFromUrl } from '../../src/assetUtil';
import { CreateImageWrapperEntry } from '../../src/entryUtil';
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

  it('should upload images returned from the API response', async () => {
    const htmlInput = '<p>Sample HTML</p>';

    await convert(htmlInput, mockSdk);

    expect(uploadImageFromUrl).toHaveBeenCalledTimes(2);
    expect(uploadImageFromUrl).toHaveBeenCalledWith(
      mockSdk.cma,
      mockSdk.ids.space,
      mockSdk.ids.environment,
      'http://example.com/image1.png',
      'Image 1',
      'asset1'
    );
    expect(uploadImageFromUrl).toHaveBeenCalledWith(
      mockSdk.cma,
      mockSdk.ids.space,
      mockSdk.ids.environment,
      'http://example.com/image2.png',
      'Image 2',
      'asset2'
    );
  });

  it('should create image wrapper entries when contentWrapperId is present', async () => {
    const htmlInput = '<p>Sample HTML</p>';

    await convert(htmlInput, mockSdk);

    expect(CreateImageWrapperEntry).toHaveBeenCalledTimes(1);
    expect(CreateImageWrapperEntry).toHaveBeenCalledWith(
      mockSdk,
      mockSdk.ids.space,
      mockSdk.ids.environment,
      'asset1',
      'http://example.com/image1.png',
      'wrapper1'
    );
  });

  it('should return the richText content from the API response', async () => {
    const htmlInput = '<p>Sample HTML</p>';

    const result = await convert(htmlInput, mockSdk);

    expect(result).toBe('<p>Converted HTML content</p>');
  });
});
