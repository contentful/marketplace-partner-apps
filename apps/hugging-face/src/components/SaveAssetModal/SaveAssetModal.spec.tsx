import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SaveAssetModal from './SaveAssetModal';

describe('SaveAssetModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockSetAssetName = vi.fn();

  const defaultProps = {
    isShown: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    assetName: '',
    setAssetName: mockSetAssetName,
    isSaving: false,
  };

  it('renders the modal when isShown is true', () => {
    render(<SaveAssetModal {...defaultProps} />);
    expect(screen.getByText('Hugging Face image generator')).toBeInTheDocument();
    expect(screen.getByText('Give your photo a name')).toBeInTheDocument();
  });

  it('does not render the modal when isShown is false', () => {
    render(<SaveAssetModal {...defaultProps} isShown={false} />);
    expect(screen.queryByText('Hugging Face image generator')).not.toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', () => {
    render(<SaveAssetModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSave when the Save button is clicked', () => {
    render(<SaveAssetModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Save image to media library'));
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('updates the asset name when the input value changes', () => {
    render(<SaveAssetModal {...defaultProps} />);
    const input = screen.getByLabelText(/Image name/i);
    fireEvent.change(input, { target: { value: 'New Image Name' } });
    expect(mockSetAssetName).toHaveBeenCalledWith('New Image Name');
  });
});
