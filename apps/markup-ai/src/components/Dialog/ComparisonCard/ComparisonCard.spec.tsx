import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonCard } from './ComparisonCard';

describe('ComparisonCard', () => {
  const mockProps = {
    label: 'Grammar Score',
    initialValue: 75.5,
    improvedValue: 85.5,
  };

  it('renders the label', () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText(mockProps.label)).toBeInTheDocument();
  });

  it('renders initial and improved values', () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText('75.50')).toBeInTheDocument();
    expect(screen.getByText('85.50')).toBeInTheDocument();
  });

  it('renders the difference with correct sign', () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText('(+10.00)')).toBeInTheDocument();
  });

  it('renders the arrow with correct rotation for improvement', () => {
    const { container } = render(<ComparisonCard {...mockProps} />);
    const arrow = container.querySelector('svg');
    expect(arrow).toHaveStyle({ transform: 'rotate(0deg)' });
  });

  it('renders the arrow with correct rotation for decrease', () => {
    const { container } = render(<ComparisonCard label="Grammar Score" initialValue={85.5} improvedValue={75.5} />);
    const arrow = container.querySelector('svg');
    expect(arrow).toHaveStyle({ transform: 'rotate(90deg)' });
  });

  it('applies correct styling to card', () => {
    const { container } = render(<ComparisonCard {...mockProps} />);
    // The card is the root element with flex display and background color
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '10px',
      gap: '6px',
      width: '100%',
      height: 'auto',
      background: '#f7f9fa',
      borderRadius: '6px',
    });
  });
});
