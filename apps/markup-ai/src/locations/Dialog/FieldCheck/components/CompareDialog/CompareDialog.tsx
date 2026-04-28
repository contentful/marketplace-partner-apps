/**
 * Compare dialog for side-by-side diff comparison of original vs rewritten content
 * Adapted from Writer's Playground CompareDialog
 */

import React from "react";
import { Modal, Button } from "@contentful/f36-components";
import { diffWords } from "diff";
import type { ScoreOutput } from "../../../../../api-client/types.gen";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

// Helper functions to determine colors based on score
const getScoreBackgroundColor = (score: number): string => {
  if (score >= 90) return "#e8f5e9";
  if (score >= 75) return "#fff9e6";
  if (score >= 60) return "#fff3e0";
  return "#ffebee";
};

const getScoreTextColor = (score: number): string => {
  if (score >= 90) return "#2e7d32";
  if (score >= 75) return "#f57c00";
  if (score >= 60) return "#ef6c00";
  return "#c62828";
};

export interface CompareDialogProps {
  isOpen: boolean;
  originalText?: string | null;
  rewrittenText?: string | null;
  originalScore?: number | null;
  rewrittenScore?: number | null;
  originalScores?: ScoreOutput;
  rewrittenScores?: ScoreOutput;
  onAccept?: (text: string) => void;
  onReject?: () => void;
}

const DiffContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${tokens.spacingM};
  max-height: 60vh;
  overflow: auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DiffPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${tokens.spacingXs};
  border-bottom: 1px solid ${tokens.gray300};
`;

const PanelTitle = styled.div`
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
`;

const ScoreBadge = styled.div<{ score: number }>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  border-radius: 16px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  background-color: ${(props) => getScoreBackgroundColor(props.score)};
  color: ${(props) => getScoreTextColor(props.score)};
`;

const ImprovementBadge = styled.span`
  color: #2e7d32;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
`;

const DiffContent = styled.div`
  padding: ${tokens.spacingM};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusSmall};
  background: ${tokens.colorWhite};
  font-family: ${tokens.fontStackMonospace};
  font-size: ${tokens.fontSizeS};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const RemovedText = styled.span`
  text-decoration: underline;
  text-decoration-color: #ef4444;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0 2px;
`;

const AddedText = styled.span`
  text-decoration: underline;
  text-decoration-color: #10b981;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  background-color: rgba(16, 185, 129, 0.1);
  padding: 0 2px;
`;

const UnchangedText = styled.span``;

const ScoreComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${tokens.spacingM};
  margin-bottom: ${tokens.spacingM};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MetricComparisonCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const MetricLabel = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};
  margin-bottom: 2px;
`;

const ScoreBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusSmall};
  min-height: 32px;
`;

const ScoreValue = styled.span<{ score: number }>`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${(props) =>
    props.score >= 90
      ? "#2e7d32"
      : props.score >= 75
        ? "#82ca9d"
        : props.score >= 60
          ? "#ffa726"
          : "#ef4444"};
`;

const ArrowIndicator = styled.div`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray400};
`;

const ImprovementIndicator = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: #2e7d32;
`;

interface DiffChunkProps {
  text: string;
  type: "removed" | "added" | "unchanged";
}

const DiffChunk: React.FC<DiffChunkProps> = ({ text, type }) => {
  if (type === "removed") return <RemovedText>{text}</RemovedText>;
  if (type === "added") return <AddedText>{text}</AddedText>;
  return <UnchangedText>{text}</UnchangedText>;
};

interface DiffViewProps {
  parts: ReturnType<typeof diffWords>;
  mode: "left" | "right";
}

const DiffView: React.FC<DiffViewProps> = ({ parts, mode }) => {
  return (
    <>
      {parts.map((part, index) => {
        const getPartTypeKey = (): string => {
          if (part.added) return "a";
          if (part.removed) return "r";
          return "u";
        };
        const key = `${String(index)}-${getPartTypeKey()}`;

        if (mode === "left") {
          // Original view: show removed (strikethrough) and unchanged
          if (part.removed) return <DiffChunk key={key} text={part.value} type="removed" />;
          if (part.added) return null; // Don't show added in original
          return <DiffChunk key={key} text={part.value} type="unchanged" />;
        } else {
          // Rewritten view: show added (underlined) and unchanged
          if (part.added) return <DiffChunk key={key} text={part.value} type="added" />;
          if (part.removed) return null; // Don't show removed in rewritten
          return <DiffChunk key={key} text={part.value} type="unchanged" />;
        }
      })}
    </>
  );
};

export const CompareDialog: React.FC<CompareDialogProps> = ({
  isOpen,
  originalText,
  rewrittenText,
  originalScore,
  rewrittenScore,
  originalScores,
  rewrittenScores,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  const parts = diffWords(originalText || "", rewrittenText || "");

  const improvement =
    originalScore !== null &&
    originalScore !== undefined &&
    rewrittenScore !== null &&
    rewrittenScore !== undefined
      ? rewrittenScore - originalScore
      : null;

  // Extract individual metric scores
  const origGrammar = originalScores?.quality?.grammar?.score ?? null;
  const origConsistency = originalScores?.quality?.consistency?.score ?? null;
  const origTerminology = originalScores?.quality?.terminology?.score ?? null;

  const newGrammar = rewrittenScores?.quality?.grammar?.score ?? null;
  const newConsistency = rewrittenScores?.quality?.consistency?.score ?? null;
  const newTerminology = rewrittenScores?.quality?.terminology?.score ?? null;

  const grammarDelta =
    origGrammar !== null && newGrammar !== null ? newGrammar - origGrammar : null;
  const consistencyDelta =
    origConsistency !== null && newConsistency !== null ? newConsistency - origConsistency : null;
  const terminologyDelta =
    origTerminology !== null && newTerminology !== null ? newTerminology - origTerminology : null;

  const handleAccept = () => {
    if (rewrittenText && onAccept) {
      onAccept(rewrittenText);
    }
  };

  return (
    <Modal isShown={isOpen} onClose={onReject || (() => {})} size="fullWidth">
      {() => (
        <>
          <Modal.Header title="Compare & Review" onClose={onReject} />
          <Modal.Content>
            {/* Detailed Score Comparison Grid */}
            {origGrammar !== null && newGrammar !== null && (
              <ScoreComparisonGrid>
                {/* Grammar */}
                <MetricComparisonCard>
                  <MetricLabel>Grammar</MetricLabel>
                  <ScoreBox>
                    <ScoreValue score={origGrammar}>{Math.round(origGrammar)}</ScoreValue>
                    <ArrowIndicator>→</ArrowIndicator>
                    <ScoreValue score={newGrammar}>{Math.round(newGrammar)}</ScoreValue>
                    {grammarDelta !== null && grammarDelta > 0 && (
                      <ImprovementIndicator>+{Math.round(grammarDelta)}</ImprovementIndicator>
                    )}
                  </ScoreBox>
                </MetricComparisonCard>

                {/* Consistency */}
                <MetricComparisonCard>
                  <MetricLabel>Consistency</MetricLabel>
                  <ScoreBox>
                    <ScoreValue score={origConsistency ?? 0}>
                      {Math.round(origConsistency ?? 0)}
                    </ScoreValue>
                    <ArrowIndicator>→</ArrowIndicator>
                    <ScoreValue score={newConsistency ?? 0}>
                      {Math.round(newConsistency ?? 0)}
                    </ScoreValue>
                    {consistencyDelta !== null && consistencyDelta > 0 && (
                      <ImprovementIndicator>+{Math.round(consistencyDelta)}</ImprovementIndicator>
                    )}
                  </ScoreBox>
                </MetricComparisonCard>

                {/* Terminology */}
                <MetricComparisonCard>
                  <MetricLabel>Terminology</MetricLabel>
                  <ScoreBox>
                    <ScoreValue score={origTerminology ?? 0}>
                      {Math.round(origTerminology ?? 0)}
                    </ScoreValue>
                    <ArrowIndicator>→</ArrowIndicator>
                    <ScoreValue score={newTerminology ?? 0}>
                      {Math.round(newTerminology ?? 0)}
                    </ScoreValue>
                    {terminologyDelta !== null && terminologyDelta > 0 && (
                      <ImprovementIndicator>+{Math.round(terminologyDelta)}</ImprovementIndicator>
                    )}
                  </ScoreBox>
                </MetricComparisonCard>
              </ScoreComparisonGrid>
            )}

            {/* Side-by-side diff view */}
            <DiffContainer>
              <DiffPanel>
                <PanelHeader>
                  <PanelTitle>Original Content</PanelTitle>
                  {originalScore !== null && (
                    <ScoreBadge score={originalScore ?? 0}>
                      {Math.round(originalScore ?? 0)}
                    </ScoreBadge>
                  )}
                </PanelHeader>
                <DiffContent>
                  <DiffView parts={parts} mode="left" />
                </DiffContent>
              </DiffPanel>

              <DiffPanel>
                <PanelHeader>
                  <PanelTitle>Improved Content</PanelTitle>
                  {rewrittenScore !== null && (
                    <ScoreBadge score={rewrittenScore ?? 0}>
                      {Math.round(rewrittenScore ?? 0)}
                      {improvement !== null && improvement > 0 && (
                        <ImprovementBadge> +{Math.round(improvement)}</ImprovementBadge>
                      )}
                    </ScoreBadge>
                  )}
                </PanelHeader>
                <DiffContent>
                  <DiffView parts={parts} mode="right" />
                </DiffContent>
              </DiffPanel>
            </DiffContainer>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={onReject}>
              Reject
            </Button>
            <Button variant="positive" onClick={handleAccept}>
              Accept Rewrite
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
