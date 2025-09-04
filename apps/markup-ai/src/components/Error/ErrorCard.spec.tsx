import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorCard } from './ErrorCard';

describe('ErrorCard', () => {
  it('renders the error message', () => {
    render(<ErrorCard message="Test error" onClose={() => {}} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<ErrorCard message="Test error" onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close error message');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders with negative variant', () => {
    render(<ErrorCard message="Test error" onClose={() => {}} />);
    expect(screen.getByTestId('error-note')).toBeInTheDocument();
  });
});
