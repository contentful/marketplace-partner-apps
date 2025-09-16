import React from 'react';
import { formatScoreForDisplay } from '../../../utils/scoreColors';

export interface GoalScore {
  label: string;
  score: number;
  color: string;
  bar: string;
}

interface IssuesAndSuggestionsProps {
  goalScores: GoalScore[];
}

export const IssuesAndSuggestions: React.FC<IssuesAndSuggestionsProps> = ({ goalScores }) => {
  return (
    <div
      className="issues-suggestions-wrapper"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {goalScores.map((goal) => (
        <div
          key={goal.label}
          className="issue-card"
          style={{
            background: goal.bar,
            border: `1px solid #E7EBEE`,
            borderRadius: 6,
            padding: '10px 15px',
            minWidth: '140px',
            flex: '1 1 calc(50% - 4px)',
            maxWidth: 'calc(50% - 4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#111B2B',
              fontWeight: 500,
              fontSize: 12,
              textAlign: 'center',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {goal.label}
          </div>
          <div
            style={{
              color: '#111B2B',
              fontWeight: 600,
              fontSize: 16,
              marginTop: 4,
            }}
          >
            {formatScoreForDisplay(goal.score)}
          </div>
        </div>
      ))}
    </div>
  );
};
