import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LottiePreviewModal from './LottiePreviewModal';

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="lottie-preview">Lottie Preview Player</div>,
}));

describe('LottiePreviewModal', () => {
  const baseProps = {
    showLottiePreviewModal: true,
    onShowLottiePreviewModalChange: vi.fn(),
    lottieJson: { v: '5.5.7', fr: 30, ip: 0, op: 60 }, // mock minimal Lottie JSON
  };

  it('renders the modal with title and player', () => {
    render(<LottiePreviewModal {...baseProps} />);
    expect(screen.getByText(/Lottie Preview - Animation/i)).toBeTruthy();
    expect(screen.getByTestId('lottie-preview')).toBeTruthy();
  });

  it('calls onShowLottiePreviewModalChange(false) when closed', () => {
    render(<LottiePreviewModal {...baseProps} />);
    const closeBtn = screen.getAllByRole('button')[0]; // "X" button in Modal.Header
    fireEvent.click(closeBtn);
    expect(baseProps.onShowLottiePreviewModalChange).toHaveBeenCalledWith(false);
  });

  it('does not render modal if showLottiePreviewModal is false', () => {
    render(<LottiePreviewModal {...baseProps} showLottiePreviewModal={false} />);
    expect(screen.queryByText(/Lottie Preview - Animation/i)).not.toBeTruthy();
    expect(screen.queryByTestId('lottie-preview')).not.toBeTruthy();
  });
});