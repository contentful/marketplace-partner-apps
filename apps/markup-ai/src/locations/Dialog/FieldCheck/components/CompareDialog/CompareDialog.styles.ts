/**
 * Styles for CompareDialog component
 */

import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { getScoreBackgroundColor, getScoreTextColor } from "../../../../../utils/scoreColors";

export const CompareContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingM};
  padding: ${tokens.spacingL};
  max-width: 1200px;
  margin: 0 auto;
`;

export const CompareHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CompareTitle = styled.h2`
  margin: 0;
  font-size: ${tokens.fontSizeXl};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray900};
`;

export const CompareContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${tokens.spacingM};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${tokens.spacingS};
  }
`;

export const ComparePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${tokens.spacingS};
  border-bottom: 1px solid ${tokens.gray200};
`;

export const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray900};
`;

export const ScoreBadge = styled.div<{ score: number; isImproved?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  border-radius: 24px;
  background-color: ${(props) => getScoreBackgroundColor(props.score)};
  color: ${(props) => getScoreTextColor(props.score)};
  font-weight: ${tokens.fontWeightDemiBold};
  font-size: ${tokens.fontSizeS};
`;

export const ImprovementIndicator = styled.span`
  color: #2e7d32;
  font-size: ${tokens.fontSizeS};
`;

export const PanelContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: ${tokens.spacingS};
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusSmall};
  font-family: ${tokens.fontStackMonospace};
  font-size: ${tokens.fontSizeS};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const CompareFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${tokens.spacingS};
  padding-top: ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};

  @media (max-width: 600px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;
