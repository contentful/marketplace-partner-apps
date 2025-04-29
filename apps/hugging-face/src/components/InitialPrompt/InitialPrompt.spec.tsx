import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InitialPrompt } from './InitialPrompt';

describe('InitialPrompt Component', () => {
  const mockSetInitialPrompt = vi.fn();
  const mockOnClickRefinePrompt = vi.fn((e) => e.preventDefault());
  const mockOnClickGenerateImage = vi.fn((e) => e.preventDefault());

  const defaultProps = {
    initialPrompt: '',
    setInitialPrompt: mockSetInitialPrompt,
    isDisabled: false,
    onClickRefinePrompt: mockOnClickRefinePrompt,
    onClickGenerateImage: mockOnClickGenerateImage,
  };

  it('renders the component correctly', () => {
    render(<InitialPrompt {...defaultProps} />);
    expect(screen.getByText('Hugging Face Image Generator')).toBeInTheDocument();
    expect(screen.getByText('Describe your image')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('A sunrise at a farm')).toBeInTheDocument();
  });

  it('calls setInitialPrompt when the textarea value changes', () => {
    render(<InitialPrompt {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('A sunrise at a farm');
    fireEvent.change(textarea, { target: { value: 'A sunset at the beach' } });
    expect(mockSetInitialPrompt).toHaveBeenCalledWith('A sunset at the beach');
  });

  it('disables buttons and textarea when isDisabled is true', () => {
    render(<InitialPrompt {...defaultProps} isDisabled={true} />);
    const refineButton = screen.getByRole('button', { name: 'Refine prompt' });
    const generateButton = screen.getByRole('button', { name: 'Generate image' });
    const textarea = screen.getByPlaceholderText('A sunrise at a farm');
    expect(textarea).toBeDisabled();
    expect(refineButton).toBeDisabled();
    expect(generateButton).toBeDisabled();
  });

  it('disables buttons when initialPrompt is empty', () => {
    render(<InitialPrompt {...defaultProps} />);
    const refineButton = screen.getByRole('button', { name: 'Refine prompt' });
    const generateButton = screen.getByRole('button', { name: 'Generate image' });
    expect(refineButton).toBeDisabled();
    expect(generateButton).toBeDisabled();
  });

  it('enables buttons and textarea when initialPrompt is not empty and isDisabled is false', () => {
    render(<InitialPrompt {...defaultProps} initialPrompt="A sunset at the beach" />);
    const refineButton = screen.getByRole('button', { name: 'Refine prompt' });
    const generateButton = screen.getByRole('button', { name: 'Generate image' });
    const textarea = screen.getByPlaceholderText('A sunrise at a farm');
    expect(textarea).not.toBeDisabled();
    expect(refineButton).not.toBeDisabled();
    expect(generateButton).not.toBeDisabled();
  });

  it('calls onClickRefinePrompt when the refine button is clicked', () => {
    render(<InitialPrompt {...defaultProps} initialPrompt="A sunset at the beach" />);
    const refineButton = screen.getByRole('button', { name: 'Refine prompt' });
    fireEvent.click(refineButton);
    expect(mockOnClickRefinePrompt).toHaveBeenCalled();
  });

  it('calls onClickGenerateImage when the generate button is clicked', () => {
    render(<InitialPrompt {...defaultProps} initialPrompt="A sunset at the beach" />);
    const generateButton = screen.getByRole('button', { name: 'Generate image' });
    fireEvent.click(generateButton);
    expect(mockOnClickGenerateImage).toHaveBeenCalled();
  });
});
