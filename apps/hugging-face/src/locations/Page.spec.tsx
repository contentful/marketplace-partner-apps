import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, afterEach, Mock } from 'vitest';
import Page from './Page';
import * as reactAppsSdk from '@contentful/react-apps-toolkit';
import * as huggingfaceText from '../services/huggingfaceText';
import * as huggingfaceImage from '../services/huggingfaceImage';
import * as uploadAssetService from '../services/uploadAsset';
import Modal from 'react-modal';

// Mock the SDK hooks
vi.mock('@contentful/react-apps-toolkit', async () => {
  const actual = await vi.importActual('@contentful/react-apps-toolkit');
  return {
    ...actual,
    useSDK: vi.fn(),
    useFieldValue: vi.fn(),
  };
});

vi.mock('../services/huggingfaceImage', () => ({
  generateImage: vi.fn(),
}));

vi.mock('../services/huggingfaceText', () => ({
  refinePrompt: vi.fn(),
}));

vi.mock('../services/uploadAsset', () => ({
  uploadAsset: vi.fn().mockImplementation(async ({ sdk }) => {
    sdk.notifier.success('Image saved to media library');
  }),
}));

beforeAll(() => {
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn((value) => `${value}`);
  global.fetch = vi.fn(() =>
    Promise.resolve({
      blob: () => Promise.resolve(new Blob(['mockImageData'], { type: 'image/png' })),
    })
  ) as Mock;
  const mockFile = new File([''], 'mock.txt', { type: 'text/plain' });
  mockFile.arrayBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(8))) as any;
  global.File = vi.fn(() => mockFile) as any;

  // Set up Modal app element to prevent warnings and DOM issues
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal-root');
  document.body.appendChild(modalRoot);
  Modal.setAppElement('#modal-root');
});

afterAll(() => {
  // Clean up the mock
  vi.restoreAllMocks();
});

describe('Page Component', () => {
  const placeholder = 'A sunrise at a farm';
  const mockFieldSdk = {
    field: {
      getValue: vi.fn(),
      setValue: vi.fn(),
      onValueChanged: vi.fn(),
      removeValue: vi.fn(),
    },
    locales: {
      default: 'en-US',
    },
    parameters: {
      installation: {
        huggingfaceApiKey: 'test-api-key',
        textModelId: 'test-text-model',
        textModelInferenceProvider: 'text-davinci-003',
        imageModelId: 'test-image-model',
        imageModelInferenceProvider: 'hf-inference',
      },
    },
    ids: {
      space: 'space-id',
    },
    notifier: {
      error: vi.fn(),
      success: vi.fn(),
    },
    cma: {
      upload: {
        create: vi.fn().mockResolvedValue({
          sys: { id: 'mock-upload-id' },
        }),
      },
      asset: {
        create: vi.fn().mockResolvedValue({
          sys: { id: 'mock-asset-id' },
          fields: {
            title: { 'en-US': 'My Image' },
            description: { 'en-US': 'A text input' },
            file: {
              'en-US': {
                contentType: 'image/png',
                fileName: 'My Image.png',
                uploadFrom: { sys: { id: 'mock-upload-id', linkType: 'Upload' } },
              },
            },
          },
        }),
        processForLocale: vi.fn().mockResolvedValue({
          sys: { id: 'mock-asset-id' },
          fields: {
            title: { 'en-US': 'My Image' },
            description: { 'en-US': 'A text input' },
            file: {
              'en-US': {
                contentType: 'image/png',
                fileName: 'My Image.png',
                url: 'https://example.com/my-image.png',
              },
            },
          },
        }),
        publish: vi.fn().mockResolvedValue({
          sys: { id: 'mock-asset-id' },
          fields: {
            title: { 'en-US': 'My Image' },
            description: { 'en-US': 'A text input' },
            file: {
              'en-US': {
                contentType: 'image/png',
                fileName: 'My Image.png',
                url: 'https://example.com/my-image.png',
              },
            },
          },
        }),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the SDK mock
    vi.mocked(reactAppsSdk.useSDK).mockReturnValue(mockFieldSdk as any);
    vi.mocked(reactAppsSdk.useFieldValue).mockReturnValue([null, vi.fn()]);
    vi.mocked(huggingfaceImage.generateImage).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('data:image/png;base64,mockImageData' as any), 100);
      });
    });
    vi.mocked(huggingfaceText.refinePrompt).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('a very refined text input.' as any), 100);
      });
    });
  });

  afterEach(async () => {
    // Close any open modals by pressing Escape key
    const openModals = screen.queryAllByRole('dialog');
    for (const modal of openModals) {
      await act(async () => {
        fireEvent.keyDown(modal, { key: 'Escape', code: 'Escape' });
      });
    }

    // Wait for any pending async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Allow all pending timers and promises to resolve
    await waitFor(
      () => {
        // Ensure no modals are still open
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    ).catch(() => {
      // If modals are still open, this is expected in some tests
      // The important part is that we've given them time to clean up
    });
  });

  it('renders the page with initial state', () => {
    render(<Page />);

    expect(screen.getByText(/Hugging Face Image Generator/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('updates prompt text when typing in the input', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A text input' } });
    });

    expect(input).toHaveValue('A text input');
  });

  it('opens the refine prompt modal and returns a refined prompt after clicking the refine prompt button', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A text input' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /Refine/i }).click();
    });
    await waitFor(() => expect(huggingfaceText.refinePrompt).toHaveBeenCalled());
    expect(await screen.findByText(/This is the AI-optimized version of your prompt/i)).toBeInTheDocument();
    expect(await screen.findByText(/a very refined text input./i)).toBeInTheDocument();
  });

  it('allows users to generate an image from a refined prompt', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A text input' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /Refine/i }).click();
    });
    await waitFor(() => expect(huggingfaceText.refinePrompt).toHaveBeenCalled());
    expect(await screen.findByText(/This is the AI-optimized version of your prompt/i)).toBeInTheDocument();
    expect(await screen.findByText(/a very refined text input./i)).toBeInTheDocument();
    await act(async () => {
      screen.getAllByRole('button', { name: /Generate image/i })[1].click(); // click the button in the modal
    });

    // Wait for and interact with the image specs modal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(await screen.findByText(/Set image specs/i)).toBeInTheDocument();

    await act(async () => {
      within(modal)
        .getByRole('button', { name: /Generate image/i })
        .click();
    });

    await waitFor(() =>
      expect(huggingfaceImage.generateImage).toHaveBeenCalledWith(
        'A text input',
        {
          ...mockFieldSdk.parameters.installation,
          imageGuidanceScale: 3.5,
          imageHeight: 500,
          imageMaxSequenceLength: 512,
          imageNumInferenceSteps: 50,
          imageWidth: 500,
        },
        'a very refined text input.'
      )
    );
    expect(await screen.findByText(/Generating your image/i)).toBeInTheDocument();
    expect(await screen.findByAltText('Generated image')).toBeInTheDocument();
  });

  it('allows users to generate an image from the initial prompt', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A text input' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /Generate/i }).click();
    });

    // Wait for and interact with the image specs modal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(await screen.findByText(/Set image specs/i)).toBeInTheDocument();

    await act(async () => {
      within(modal)
        .getByRole('button', { name: /Generate image/i })
        .click();
    });

    await waitFor(() =>
      expect(huggingfaceImage.generateImage).toHaveBeenCalledWith(
        'A text input',
        {
          ...mockFieldSdk.parameters.installation,
          imageGuidanceScale: 3.5,
          imageHeight: 500,
          imageMaxSequenceLength: 512,
          imageNumInferenceSteps: 50,
          imageWidth: 500,
        },
        ''
      )
    );
    expect(await screen.findByText(/Generating your image/i)).toBeInTheDocument();
    expect(await screen.findByAltText('Generated image')).toBeInTheDocument();
  });

  it('allows users to name their image and save it', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A text input' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /Generate/i }).click();
    });

    // Wait for and interact with the image specs modal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(await screen.findByText(/Set image specs/i)).toBeInTheDocument();

    await act(async () => {
      within(modal)
        .getByRole('button', { name: /Generate image/i })
        .click();
    });

    expect(await screen.findByAltText('Generated image')).toBeInTheDocument();
    const nextButton = await screen.findByRole('button', { name: /Next/i });
    await act(async () => {
      nextButton.click();
    });
    expect(await screen.findByText(/Give your photo a name/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Image name/);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'My Image' } });
    });

    expect(nameInput).toHaveValue('My Image');
    const saveButton = screen.getByRole('button', { name: /Save image to media library/i });
    await act(async () => {
      saveButton.click();
    });

    await waitFor(() => {
      expect(uploadAssetService.uploadAsset).toHaveBeenCalledWith({
        sdk: mockFieldSdk,
        initialPrompt: 'A text input',
        assetName: 'My Image',
        generatedImage: 'data:image/png;base64,mockImageData',
      });
    });

    expect(mockFieldSdk.notifier.success).toHaveBeenCalledWith('Image saved to media library');
    expect(mockFieldSdk.notifier.error).not.toHaveBeenCalled();
  });
});
