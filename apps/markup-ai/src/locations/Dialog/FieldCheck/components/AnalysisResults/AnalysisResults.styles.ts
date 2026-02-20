/**
 * Styles for AnalysisResults component
 */

import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  getScoreBackgroundColor,
  getScoreTextColor,
  getScoreNumberColor,
} from "../../../../../utils/scoreColors";

export const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingM};

  @media (max-width: 600px) {
    padding: ${tokens.spacingS};
    gap: ${tokens.spacingXs};
  }
`;

export const QualityScoreBadge = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingXs} ${tokens.spacingM};
  border-radius: 24px;
  background-color: ${(props) => getScoreBackgroundColor(props.score)};
  font-weight: ${tokens.fontWeightDemiBold};
  font-size: ${tokens.fontSizeM};
  color: ${(props) => getScoreTextColor(props.score)};
`;

export const ScoreRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${tokens.spacingXs} 0;
  border-bottom: 1px solid ${tokens.gray200};

  &:last-child {
    border-bottom: none;
  }
`;

export const ScoreLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

export const ScoreLabelText = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};
`;

export const IssueCount = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
`;

export const ScoreValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

export const ScoreNumber = styled.span<{ score: number }>`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${(props) => getScoreNumberColor(props.score)};
`;

export const DeltaIndicator = styled.span<{ delta: number }>`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${(props) => (props.delta >= 0 ? "#2e7d32" : "#c62828")};
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingL};
`;

export const LoadingContent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${tokens.spacingS};
`;

export const EmptyContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingL};
`;

export const EmptyContent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${tokens.spacingS};
  color: ${tokens.gray600};
`;

export const DividerLine = styled.div`
  border-top: 1px dashed ${tokens.gray300};
  margin: ${tokens.spacingS} 0;
`;

export const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacingXs} 0;
`;

export const DetailLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
`;

export const DetailValue = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray800};
`;
