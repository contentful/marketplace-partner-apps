/**
 * Analysis results component showing quality scores and breakdowns
 * Uses fixed placeholders to maintain consistent height
 */

import React, { useState } from "react";
import { Spinner, Text, Button, Collapse, Box } from "@contentful/f36-components";
import { CaretDownIcon, CaretUpIcon } from "@contentful/f36-icons";
import type { ScoreOutput } from "../../../../../api-client/types.gen";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { calculateScoreDelta } from "../../utils/format";
import {
  getScoreBackgroundColor,
  getScoreBorderColor,
  getScoreTextColor,
  getScoreNumberColor,
} from "../../../../../utils/scoreColors";

export interface AnalysisResultsProps {
  scores?: ScoreOutput | null;
  baseline?: ScoreOutput | null;
  isLoading?: boolean;
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${tokens.spacingS} ${tokens.spacingM};
  background: ${tokens.gray100};
  border-bottom: 1px solid ${tokens.gray200};
  flex-shrink: 0;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${tokens.spacingM};
  gap: ${tokens.spacingS};
  overflow-y: auto;
`;

const QualityScoreCard = styled.div<{ score: number | null }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingM};
  border-radius: ${tokens.borderRadiusMedium};
  background: ${(props) => getScoreBackgroundColor(props.score)};
  border: 1px solid ${(props) => getScoreBorderColor(props.score)};
  flex-shrink: 0;
`;

const QualityScoreText = styled.div<{ score: number | null }>`
  font-size: ${tokens.fontSizeXl};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${(props) => getScoreTextColor(props.score)};
`;

const ScoresGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
  flex: 1;
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacingS};
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusSmall};
`;

const ScoreLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ScoreLabelText = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray800};
`;

const IssueCount = styled.span`
  font-size: 11px;
  color: ${tokens.gray600};
`;

const ScoreValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const ScoreNumber = styled.span<{ score: number | null }>`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  min-width: 28px;
  text-align: right;
  color: ${(props) => getScoreNumberColor(props.score)};
`;

const DeltaIndicator = styled.span<{ delta: number }>`
  font-size: 11px;
  font-weight: ${tokens.fontWeightMedium};
  color: ${(props) => (props.delta >= 0 ? "#2e7d32" : "#c62828")};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  gap: ${tokens.spacingS};
`;

const PlaceholderText = styled.span`
  color: ${tokens.gray400};
`;

const Divider = styled.div`
  border-top: 1px dashed ${tokens.gray300};
  margin: ${tokens.spacingS} 0;
`;

const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusSmall};
`;

const DetailLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
`;

const DetailValue = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray800};
`;

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  scores,
  baseline,
  isLoading = false,
}) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Extract scores
  const quality = scores?.quality?.score ?? null;
  const grammar = scores?.quality?.grammar?.score ?? null;
  const consistency = scores?.quality?.consistency?.score ?? null;
  const terminology = scores?.quality?.terminology?.score ?? null;

  // Extract issue counts
  const grammarIssues = scores?.quality?.grammar?.issues ?? null;
  const consistencyIssues = scores?.quality?.consistency?.issues ?? null;
  const terminologyIssues = scores?.quality?.terminology?.issues ?? null;

  // Extract additional details
  const clarityScore = scores?.analysis?.clarity?.score ?? null;
  const toneScore = scores?.analysis?.tone?.score ?? null;
  const hasMoreDetails = clarityScore !== null || toneScore !== null;

  // Calculate deltas if baseline exists
  const origGrammar = baseline?.quality?.grammar?.score ?? null;
  const origConsistency = baseline?.quality?.consistency?.score ?? null;
  const origTerminology = baseline?.quality?.terminology?.score ?? null;

  const grammarDelta = calculateScoreDelta(grammar, origGrammar);
  const consistencyDelta = calculateScoreDelta(consistency, origConsistency);
  const terminologyDelta = calculateScoreDelta(terminology, origTerminology);

  const formatScore = (score: number | null) => {
    if (score === null) return <PlaceholderText>--</PlaceholderText>;
    return Math.round(score);
  };

  const formatIssues = (count: number | null) => {
    if (count === null) return "";
    const plural = count === 1 ? "" : "s";
    return `${String(count)} issue${plural}`;
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>Analysis Results</HeaderTitle>
      </Header>

      <Content style={{ position: "relative" }}>
        {isLoading && (
          <LoadingOverlay>
            <Spinner size="medium" />
            <Text fontColor="gray600" fontSize="fontSizeS">
              Analyzing...
            </Text>
          </LoadingOverlay>
        )}

        <QualityScoreCard score={quality}>
          <QualityScoreText score={quality}>
            {quality !== null ? `Quality: ${String(Math.round(quality))}` : "Quality: --"}
          </QualityScoreText>
        </QualityScoreCard>

        <ScoresGrid>
          <ScoreRow>
            <ScoreLabel>
              <ScoreLabelText>Grammar</ScoreLabelText>
              <IssueCount>{formatIssues(grammarIssues)}</IssueCount>
            </ScoreLabel>
            <ScoreValue>
              <ScoreNumber score={grammar}>{formatScore(grammar)}</ScoreNumber>
              {grammarDelta !== null && grammarDelta !== 0 && (
                <DeltaIndicator delta={grammarDelta}>
                  {grammarDelta > 0 ? "+" : ""}
                  {grammarDelta}
                </DeltaIndicator>
              )}
            </ScoreValue>
          </ScoreRow>

          <ScoreRow>
            <ScoreLabel>
              <ScoreLabelText>Consistency</ScoreLabelText>
              <IssueCount>{formatIssues(consistencyIssues)}</IssueCount>
            </ScoreLabel>
            <ScoreValue>
              <ScoreNumber score={consistency}>{formatScore(consistency)}</ScoreNumber>
              {consistencyDelta !== null && consistencyDelta !== 0 && (
                <DeltaIndicator delta={consistencyDelta}>
                  {consistencyDelta > 0 ? "+" : ""}
                  {consistencyDelta}
                </DeltaIndicator>
              )}
            </ScoreValue>
          </ScoreRow>

          <ScoreRow>
            <ScoreLabel>
              <ScoreLabelText>Terminology</ScoreLabelText>
              <IssueCount>{formatIssues(terminologyIssues)}</IssueCount>
            </ScoreLabel>
            <ScoreValue>
              <ScoreNumber score={terminology}>{formatScore(terminology)}</ScoreNumber>
              {terminologyDelta !== null && terminologyDelta !== 0 && (
                <DeltaIndicator delta={terminologyDelta}>
                  {terminologyDelta > 0 ? "+" : ""}
                  {terminologyDelta}
                </DeltaIndicator>
              )}
            </ScoreValue>
          </ScoreRow>
        </ScoresGrid>

        {/* More Details Section */}
        {hasMoreDetails && (
          <>
            <Divider />
            <Box>
              <Button
                variant="transparent"
                size="small"
                startIcon={showMoreDetails ? <CaretUpIcon /> : <CaretDownIcon />}
                onClick={() => {
                  setShowMoreDetails(!showMoreDetails);
                }}
                isFullWidth
              >
                {showMoreDetails ? "Hide" : "Show"} More Details
              </Button>
              <Collapse isExpanded={showMoreDetails}>
                <Box marginTop="spacingS">
                  <DetailsSection>
                    {clarityScore !== null && (
                      <DetailRow>
                        <DetailLabel>Clarity</DetailLabel>
                        <DetailValue>{Math.round(clarityScore)}</DetailValue>
                      </DetailRow>
                    )}
                    {toneScore !== null && (
                      <DetailRow>
                        <DetailLabel>Tone</DetailLabel>
                        <DetailValue>{Math.round(toneScore)}</DetailValue>
                      </DetailRow>
                    )}
                  </DetailsSection>
                </Box>
              </Collapse>
            </Box>
          </>
        )}
      </Content>
    </Container>
  );
};
