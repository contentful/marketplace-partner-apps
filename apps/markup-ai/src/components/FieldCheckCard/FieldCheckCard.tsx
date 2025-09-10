import React from 'react';
import { Button } from '@contentful/f36-components';
import { ChevronDownIcon, ChevronRightIcon } from '@contentful/f36-icons';
import { FieldCheck } from '../../types/content';
import { LoadingState } from '../LoadingState/LoadingState';
import {
  CardContainer,
  CardWrapper,
  ChevronWrapper,
  FieldName,
  HeaderFlex,
  RewriteButtonBox,
  ScoreBox,
} from './FieldCheckCard.styles';
import { getScoreColor, formatScoreForDisplay } from '../../utils/scoreColors';
import { AnalysisSection } from './AnalysisSection';
import { useSDK } from '@contentful/react-apps-toolkit';

interface FieldCheckCardProps {
  fieldCheck: FieldCheck;
  onRewriteWithDialog?: (fieldId: string) => void;
  fieldName: string;
  isExpanded: boolean;
  onToggleExpand: (fieldId: string) => void;
}

export const FieldCheckCard: React.FC<FieldCheckCardProps> = ({
  fieldCheck,
  onRewriteWithDialog,
  fieldName,
  isExpanded,
  onToggleExpand,
}) => {
  const sdk = useSDK();
  const { fieldId, isChecking, checkResponse } = fieldCheck;

  if (isChecking && !checkResponse) {
    return (
      <CardContainer>
        <LoadingState message="Analyzing content" />
      </CardContainer>
    );
  }

  if (!checkResponse) {
    return (
      <CardContainer>
        <LoadingState message="Waiting for changes to settle" />
      </CardContainer>
    );
  }

  const handleButtonClick = () => {
    if (onRewriteWithDialog) {
      onRewriteWithDialog(fieldId);
    }
  };

  const handleMoreDetails = () => {
    if (!checkResponse) return;
    sdk.dialogs.openCurrent({
      width: 600,
      title: 'More Details',
      parameters: {
        checkResponse: JSON.parse(JSON.stringify(checkResponse)),
      },
    });
  };

  return (
    <CardWrapper data-expanded={isExpanded}>
      <HeaderFlex data-clickable data-testid="field-header" onClick={() => onToggleExpand(fieldId)}>
        <ChevronWrapper>
          {isExpanded ? <ChevronDownIcon size="small" /> : <ChevronRightIcon size="small" />}
        </ChevronWrapper>
        <FieldName data-testid="field-name">{fieldName}</FieldName>
        <ScoreBox
          data-testid="field-score"
          background={getScoreColor(checkResponse.original.scores.quality.score).background}
        >
          {formatScoreForDisplay(checkResponse.original.scores.quality.score)}
        </ScoreBox>
      </HeaderFlex>
      {isExpanded && (
        <>
          <AnalysisSection
            scores={checkResponse.original.scores}
            onMoreDetails={handleMoreDetails}
            data-testid="analysis-section"
          />
          <RewriteButtonBox>
            <Button
              variant="secondary"
              size="small"
              isFullWidth
              isLoading={isChecking}
              onClick={handleButtonClick}
              isDisabled={isChecking}
            >
              {isChecking ? 'Rewriting' : 'Rewrite'}
            </Button>
          </RewriteButtonBox>
        </>
      )}
    </CardWrapper>
  );
};
