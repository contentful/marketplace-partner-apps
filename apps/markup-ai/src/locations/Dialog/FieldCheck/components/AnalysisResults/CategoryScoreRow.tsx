/**
 * Individual category score row component
 */

import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@contentful/f36-icons";
import {
  ScoreRow,
  ScoreLabel,
  ScoreLabelText,
  IssueCount,
  ScoreValue,
  ScoreNumber,
  DeltaIndicator,
} from "./AnalysisResults.styles";

export interface CategoryScoreRowProps {
  label: string;
  score: number | null;
  issuesCount?: number | null;
  delta?: number | null;
}

export const CategoryScoreRow: React.FC<CategoryScoreRowProps> = ({
  label,
  score,
  issuesCount,
  delta,
}) => {
  if (score === null) {
    return null;
  }

  return (
    <ScoreRow>
      <ScoreLabel>
        <ScoreLabelText>{label}</ScoreLabelText>
        <IssueCount>Issues: {issuesCount ?? 0}</IssueCount>
      </ScoreLabel>
      <ScoreValue>
        <ScoreNumber score={score}>{Math.round(score)}</ScoreNumber>
        {typeof delta === "number" && delta !== 0 && (
          <DeltaIndicator delta={delta}>
            {delta >= 0 ? <ArrowUpIcon variant="muted" /> : <ArrowDownIcon variant="muted" />}
            {delta >= 0 ? "+" : ""}
            {Math.abs(Math.round(delta))}
          </DeltaIndicator>
        )}
      </ScoreValue>
    </ScoreRow>
  );
};
