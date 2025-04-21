// apps/hugging-face/test/Page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import Page from './Page';
import * as appSdk from '@contentful/app-sdk';
import * as reactAppsSdk from '@contentful/react-apps-toolkit';
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
  generateImageDescription: vi.fn()
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
  const placeholder = 'e.g., A calm forest with a surreal glow';
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
        imageModelId: 'test-image-model',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the SDK mock
    vi.mocked(reactAppsSdk.useSDK).mockReturnValue(mockFieldSdk as any);
    vi.mocked(reactAppsSdk.useFieldValue).mockReturnValue([null, vi.fn()]);
  });

  it('renders the page with initial state', () => {
    render(<Page />);
    
    expect(screen.getByText(/Describe your image concept/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('updates prompt text when typing in the input', () => {
    render(<Page />);
    
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A mountain landscape' } });
    
    expect(input).toHaveValue('A mountain landscape');
  });

  it('shows loading state when generating an image', async () => {
    // Instead of dynamic import, use the imported module directly
    vi.fn(huggingfaceImage.generateImage).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve('data:image/png;base64,mockImageData' as any), 100);
      });
    });

    render(<Page />);
    
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A mountain landscape' } });
    
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);
    
    // Should show loading state
    expect(await screen.findByText(/Generating/i)).toBeInTheDocument();
    
    // After loading completes
    await waitFor(() => {
      expect(screen.queryByText(/Generating/i)).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('shows the generated image', async () => {
    render(<Page />);
    
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: 'A mountain landscape' } });
    
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);
    
    // Wait for the image to be generated
    await waitFor(() => {
      const image = screen.getByAltText('Generated');
      expect(image).toBeInTheDocument();
    });
  });
});