import React from 'react';
import { css } from '@emotion/css';
import { diffWords } from 'diff';
import { DiffLine } from '../types';

interface DiffViewerProps {
  diffLines: DiffLine[];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffLines }) => {
  const diffs = [];
  for (const line of diffLines) {
    diffs.push(diffWords(line.diffOriginal, line.diffUpdated));
  }

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}>
      {diffs.map((diff, idx) => (
        <div
          key={idx}
          className={css({
            display: 'flex',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            overflow: 'hidden',
            '&:hover': {
              backgroundColor: '#f1f3f4',
            },
          })}>
          <div
            className={css({
              padding: '12px 16px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px',
              lineHeight: '20px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            })}>
            {diff.map((part, i) => (
              <span
                key={i}
                className={css({
                  backgroundColor: part.added ? '#d1f4d1' : part.removed ? '#ffeef0' : 'transparent',
                  color: part.added ? '#116329' : part.removed ? '#82071e' : '#24292f',
                  textDecoration: part.removed ? 'line-through' : 'none',
                  padding: part.added || part.removed ? '1px 2px' : '0',
                  borderRadius: '2px',
                })}>
                {part.value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
