import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import GlobalErrorBoundary from '@/components/ErrorBoundary/GlobalErrorBoundary';

describe('GlobalErrorBoundary', () => {
  const resetMock = jest.fn();

  beforeEach(() => {
    resetMock.mockClear();
  });

  it('renders the component with the correct text and image', () => {
    render(<GlobalErrorBoundary reset={resetMock} />);

    expect(screen.getByText("Something's Gone Wrong!")).toBeInTheDocument();
    expect(
      screen.getByText("We're sorry for the inconvenience. Please try again later.")
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /error/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls the reset function when the retry button is clicked', () => {
    render(<GlobalErrorBoundary reset={resetMock} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});
