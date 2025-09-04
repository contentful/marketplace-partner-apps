import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StartBlockWaiting from './StartBlockWaiting';

describe('StartBlockWaiting', () => {
  it('renders the waiting message', () => {
    render(<StartBlockWaiting />);
    expect(screen.getByText('Waiting for user to write, add, or update content')).toBeInTheDocument();
  });

  it('renders the logo image', () => {
    render(<StartBlockWaiting />);
    const logo = screen.getByAltText('Markup AI Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'logos/markup_Logo_Horz_Coral.svg');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<StartBlockWaiting />);
    expect(container.querySelector('div[data-testid="container"]')).toBeInTheDocument();
    expect(container.querySelector('div[data-testid="wrapper"]')).toBeInTheDocument();
    expect(container.querySelector('div[data-testid="icon-wrapper"]')).toBeInTheDocument();
  });
});
