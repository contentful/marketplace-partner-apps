import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, vi, expect, beforeAll, afterEach } from 'vitest';
import { GenerateImageSpecsModal } from './GenerateImageSpecsModal';
import Modal from 'react-modal';

describe('GenerateImageSpecsModal', () => {
  beforeAll(() => {
    // Set up Modal app element to prevent warnings and DOM issues
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
    Modal.setAppElement('#modal-root');
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

  const defaultProps = {
    isShown: true,
    imageNumInferenceSteps: 50,
    imageHeight: 512,
    imageWidth: 512,
    imageGuidanceScale: 7.5,
    imageMaxSequenceLength: 77,
    onChange: vi.fn(),
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the modal when isShown is true', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);
    expect(screen.getByText('Set image specs')).toBeInTheDocument();
  });

  it('does not render the modal when isShown is false', () => {
    render(<GenerateImageSpecsModal {...defaultProps} isShown={false} />);
    expect(screen.queryByText('Set image specs')).not.toBeInTheDocument();
  });

  it('displays all form fields with correct labels and help text', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);

    expect(screen.getByText('Image generation steps')).toBeInTheDocument();
    expect(screen.getByText('Number of inference steps for image generation (higher = better quality, slower).')).toBeInTheDocument();

    expect(screen.getByText('Image height (px)')).toBeInTheDocument();
    expect(screen.getByText('Height of generated image in pixels.')).toBeInTheDocument();

    expect(screen.getByText('Image width (px)')).toBeInTheDocument();
    expect(screen.getByText('Width of generated image in pixels.')).toBeInTheDocument();

    expect(screen.getByText('Guidance scale')).toBeInTheDocument();
    expect(screen.getByText('How closely the image should follow the prompt (higher = more literal, but can be less creative).')).toBeInTheDocument();

    expect(screen.getByText('Max sequence length')).toBeInTheDocument();
    expect(screen.getByText('Maximum sequence length for the prompt (advanced, usually leave as default).')).toBeInTheDocument();
  });

  it('calls onChange when form fields are updated', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);

    const stepsInput = screen.getByRole('spinbutton', { name: /image generation steps/i });
    fireEvent.change(stepsInput, { target: { value: '75' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith({ imageNumInferenceSteps: 75 });

    const heightInput = screen.getByRole('spinbutton', { name: /image height/i });
    fireEvent.change(heightInput, { target: { value: '768' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith({ imageHeight: 768 });

    const widthInput = screen.getByRole('spinbutton', { name: /image width/i });
    fireEvent.change(widthInput, { target: { value: '768' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith({ imageWidth: 768 });

    const guidanceInput = screen.getByRole('spinbutton', { name: /guidance scale/i });
    fireEvent.change(guidanceInput, { target: { value: '8.5' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith({ imageGuidanceScale: 8.5 });

    const sequenceInput = screen.getByRole('spinbutton', { name: /max sequence length/i });
    fireEvent.change(sequenceInput, { target: { value: '100' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith({ imageMaxSequenceLength: 100 });
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onSubmit when the Generate image button is clicked', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate image' }));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('enforces min/max constraints on numeric inputs', () => {
    render(<GenerateImageSpecsModal {...defaultProps} />);

    const stepsInput = screen.getByRole('spinbutton', { name: /image generation steps/i });
    expect(stepsInput).toHaveAttribute('min', '1');
    expect(stepsInput).toHaveAttribute('max', '100');

    const heightInput = screen.getByRole('spinbutton', { name: /image height/i });
    expect(heightInput).toHaveAttribute('min', '64');
    expect(heightInput).toHaveAttribute('max', '2048');

    const widthInput = screen.getByRole('spinbutton', { name: /image width/i });
    expect(widthInput).toHaveAttribute('min', '64');
    expect(widthInput).toHaveAttribute('max', '2048');

    const guidanceInput = screen.getByRole('spinbutton', { name: /guidance scale/i });
    expect(guidanceInput).toHaveAttribute('min', '1');
    expect(guidanceInput).toHaveAttribute('max', '20');
    expect(guidanceInput).toHaveAttribute('step', '0.1');

    const sequenceInput = screen.getByRole('spinbutton', { name: /max sequence length/i });
    expect(sequenceInput).toHaveAttribute('min', '64');
    expect(sequenceInput).toHaveAttribute('max', '2048');
  });
});
