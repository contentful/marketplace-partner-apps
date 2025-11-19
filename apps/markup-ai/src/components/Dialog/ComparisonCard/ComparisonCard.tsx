import React from 'react';
import { Card, Label, ValueGroup, Value, ImprovedValue, Diff, Arrow } from './ComparisonCard.styles';

export interface ComparisonCardProps {
  label: string;
  initialValue: number;
  improvedValue: number;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ label, initialValue, improvedValue }) => {
  const diff = improvedValue - initialValue;
  const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(2);
  // For increase: 0 degrees (pointing up-right)
  // For decrease: 90 degrees (pointing down-right)
  // For no change: 45 degrees (pointing right)
  const getRotation = (diff: number) => {
    if (diff > 0) return 0;
    if (diff < 0) return 90;
    return 45;
  };
  const rotation = getRotation(diff);

  return (
    <Card>
      <Label>{label}</Label>
      <ValueGroup>
        <Value>{initialValue.toFixed(2)}</Value>
        <Arrow>
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <path
              d="M1 8L8 1M8 1L5 1M8 1L8 4"
              stroke="#5A657C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Arrow>
        <ValueGroup>
          <ImprovedValue>{improvedValue.toFixed(2)}</ImprovedValue>
          <Diff>({diffStr})</Diff>
        </ValueGroup>
      </ValueGroup>
    </Card>
  );
};
