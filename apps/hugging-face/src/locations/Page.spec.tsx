import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import Page from './Page';
import * as reactAppsSdk from '@contentful/react-apps-toolkit';
import * as huggingfaceText from '../services/huggingfaceText';
import * as huggingfaceImage from '../services/huggingfaceImage';
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

beforeAll(() => {
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn((value) => `${value}`);
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

  it('renders the page with initial state', () => {
    render(<Page />);

    expect(screen.getByText(/Hugging Face Image Generator/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('updates prompt text when typing in the input', () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A text input' } });

    expect(input).toHaveValue('A text input');
  });

  it('opens the refine prompt modal and returns a refined prompt after clicking the refine prompt button', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A text input' } });
    screen.getByRole('button', { name: /Refine/i }).click();
    await waitFor(() => expect(huggingfaceText.refinePrompt).toHaveBeenCalled());
    expect(await screen.findByText(/This is the AI-optimized version of your prompt/i)).toBeInTheDocument();
    expect(await screen.findByText(/a very refined text input./i)).toBeInTheDocument();
  });

  it('allows users to generate an image from a refined prompt', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A text input' } });
    screen.getByRole('button', { name: /Refine/i }).click();
    expect(await screen.findByText(/a very refined text input./i)).toBeInTheDocument();
    screen.getAllByRole('button', { name: /Generate image/i })[1].click(); // click the button in the modal
    await waitFor(() =>
      expect(huggingfaceImage.generateImage).toHaveBeenCalledWith('A text input', mockFieldSdk.parameters.installation, 'a very refined text input.')
    );
    expect(await screen.findByText(/Generating your image/i)).toBeInTheDocument();
    expect(await screen.findByAltText('Generated image')).toBeInTheDocument();
  });

  it('allows users to generate an image from the initial prompt', async () => {
    render(<Page />);

    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A text input' } });
    screen.getByRole('button', { name: /Generate/i }).click();
    await waitFor(() => expect(huggingfaceImage.generateImage).toHaveBeenCalledWith('A text input', mockFieldSdk.parameters.installation, ''));
    expect(await screen.findByText(/Generating your image/i)).toBeInTheDocument();
    expect(await screen.findByAltText('Generated image')).toBeInTheDocument();
  });
});
