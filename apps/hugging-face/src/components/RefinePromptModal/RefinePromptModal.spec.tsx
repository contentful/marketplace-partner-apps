import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { RefinePromptModal } from './RefinePromptModal';

describe('RefinePromptModal', () => {
  const defaultProps = {
    showRefinePromptModal: true,
    refinedPrompt: 'AI Refined prompt',
    setRefinedPrompt: vi.fn(),
    error: null,
    isRefining: false,
    onSubmitRefinedPrompt: vi.fn(),
    closeRefinePromptModal: vi.fn(),
  };

  it('renders the modal when showRefinePromptModal is true', () => {
    render(<RefinePromptModal {...defaultProps} />);
    expect(screen.getByText('Refine prompt')).toBeInTheDocument();
  });

  it('displays an error note when error is present', () => {
    render(<RefinePromptModal {...defaultProps} error="Error: failed to refine prompt with text model. Please try again." />);
    expect(screen.getByText('Error: failed to refine prompt with text model. Please try again.')).toBeInTheDocument();
  });

  it('shows loading state when isRefining is true', () => {
    render(<RefinePromptModal {...defaultProps} isRefining={true} />);
    expect(screen.getByText('Generating new prompt')).toBeInTheDocument();
  });

  it('renders the textarea with the refined prompt', () => {
    render(<RefinePromptModal {...defaultProps} />);
    const textarea = screen.getByText('AI Refined prompt') as HTMLTextAreaElement;
    expect(textarea.value).toBe('AI Refined prompt');
  });

  it('calls setRefinedPrompt when the textarea value changes', () => {
    render(<RefinePromptModal {...defaultProps} />);
    const textarea = screen.getByText('AI Refined prompt') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated prompt' } });
    expect(defaultProps.setRefinedPrompt).toHaveBeenCalledWith('Updated prompt');
  });

  it('disables the "Generate image" button when isRefining is true', () => {
    render(<RefinePromptModal {...defaultProps} isRefining={true} />);
    const button = screen.getByRole('button', { name: 'Generate image' });
    expect(button).toBeDisabled();
  });

  it('disables the "Generate image" button when refinedPrompt is empty', () => {
    render(<RefinePromptModal {...defaultProps} refinedPrompt="" />);
    const button = screen.getByRole('button', { name: 'Generate image' });
    expect(button).toBeDisabled();
  });

  it('disables the "Generate image" button when there is an error', () => {
    render(<RefinePromptModal {...defaultProps} error="Something went wrong" />);
    const button = screen.getByRole('button', { name: 'Generate image' });
    expect(button).toBeDisabled();
  });

  it('calls onSubmitRefinedPrompt when "Generate image" button is clicked', () => {
    render(<RefinePromptModal {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Generate image' });
    fireEvent.click(button);
    expect(defaultProps.onSubmitRefinedPrompt).toHaveBeenCalled();
  });

  it('calls closeRefinePromptModal when "Cancel" button is clicked', () => {
    render(<RefinePromptModal {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(button);
    expect(defaultProps.closeRefinePromptModal).toHaveBeenCalled();
  });
});
