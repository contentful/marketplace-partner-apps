import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IssuesAndSuggestions } from './IssuesAndSuggestions';

describe('IssuesAndSuggestions', () => {
  const mockGoalScores = [
    {
      label: 'Grammar',
      score: 95,
      color: '#008539',
      bar: '#E6F4EA',
    },
    {
      label: 'Style',
      score: 85,
      color: '#FFB020',
      bar: '#FFF4E5',
    },
  ];

  it('renders all goal scores', () => {
    render(<IssuesAndSuggestions goalScores={mockGoalScores} />);

    mockGoalScores.forEach((goal) => {
      expect(screen.getByText(goal.label)).toBeInTheDocument();
      expect(screen.getByText(goal.score.toString())).toBeInTheDocument();
    });
  });

  it('renders correct number of issue cards', () => {
    const { container } = render(<IssuesAndSuggestions goalScores={mockGoalScores} />);
    const cards = container.querySelectorAll('.issue-card');
    expect(cards).toHaveLength(mockGoalScores.length);
  });

  it('applies correct styling to wrapper', () => {
    const { container } = render(<IssuesAndSuggestions goalScores={mockGoalScores} />);
    const wrapper = container.querySelector('.issues-suggestions-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      justifyContent: 'center',
      width: '100%',
    });
  });
});
