import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { GenerateImageModal } from './GenerateImageModal';

describe('GenerateImageModal', () => {
  const defaultProps = {
    showGeneratingImageModal: true,
    prompt: 'A beautiful sunset over the mountains',
    setPrompt: vi.fn(),
    generatedImage: null,
    error: null,
    timer: 30,
    isGenerating: false,
    onClickNextAfterImageGeneration: vi.fn(),
    onRetryImageGeneration: vi.fn(),
    onRegenerateImage: vi.fn(),
    closeGeneratingImageModal: vi.fn(),
    imageWidth: 500,
    imageHeight: 500,
  };

  it('renders the modal', () => {
    render(<GenerateImageModal {...defaultProps} />);
    expect(screen.getByText('Hugging Face image generator')).toBeInTheDocument();
  });

  it('displays the prompt text', () => {
    render(<GenerateImageModal {...defaultProps} />);
    const textarea = screen.getByLabelText('Prompt');
    expect(textarea).toHaveValue(defaultProps.prompt);
  });

  it('shows the timer with the correct value', () => {
    render(<GenerateImageModal {...defaultProps} />);
    expect(screen.getByText(`Timer: ${defaultProps.timer} seconds`)).toBeInTheDocument();
  });

  it('displays an error message when there is an error', () => {
    const props = { ...defaultProps, error: 'Error: failed to load image. Please try again.' };
    render(<GenerateImageModal {...props} />);
    expect(screen.getByText('Error: failed to load image. Please try again.')).toBeInTheDocument();
  });

  it('renders a skeleton loader when the image is not generated and there is no error', () => {
    render(<GenerateImageModal {...defaultProps} />);
    expect(screen.getByLabelText('Loading component...')).toBeInTheDocument();
  });

  it('renders the generated image when available', () => {
    const props = { ...defaultProps, generatedImage: 'image-url' };
    render(<GenerateImageModal {...props} />);
    expect(screen.getByAltText('Generated image')).toHaveAttribute('src', 'image-url');
  });

  it('calls closeGeneratingImageModal when the Cancel button is clicked', () => {
    render(<GenerateImageModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.closeGeneratingImageModal).toHaveBeenCalled();
  });

  it('calls onRetryImageGeneration when the Retry button is clicked and there is an error', () => {
    const props = { ...defaultProps, error: 'Something went wrong' };
    render(<GenerateImageModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(props.onRetryImageGeneration).toHaveBeenCalled();
  });

  it('calls onClickNextAfterImageGeneration when the Next button is clicked and the image is generated', () => {
    const props = { ...defaultProps, generatedImage: 'image-url' };
    render(<GenerateImageModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(props.onClickNextAfterImageGeneration).toHaveBeenCalled();
  });

  it('disables the Retry button when isGenerating is true', () => {
    const props = { ...defaultProps, error: 'Something went wrong', isGenerating: true };
    render(<GenerateImageModal {...props} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });

  it('disables the Next button when isGenerating is true', () => {
    const props = { ...defaultProps, isGenerating: true };
    render(<GenerateImageModal {...props} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables the Next button when there is no generated image', () => {
    const propsWithoutImage = { ...defaultProps, generatedImage: null };
    render(<GenerateImageModal {...propsWithoutImage} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
