import React from 'react';
import {
  SectionWrapper,
  Row,
  MetricGroup,
  MetricRow,
  Label,
  Score,
  BarTrack,
  BarFill,
  Title,
} from './AnalysisSection.styles';
import { ScoreOutput } from '../../api-client';
import { getScoreColorString, formatScoreForDisplay } from '../../utils/scoreColors';
import { useTranslation } from '../../contexts/LocalizationContext';
import { METRIC_ORDER, METRIC_LABEL_KEYS, getMetricScore as readScore } from '../../constants/metrics';

interface AnalysisSectionProps {
  scores?: ScoreOutput;
  onMoreDetails?: () => void; // Add this prop
}

export const AnalysisSection: React.FC<AnalysisSectionProps & { 'data-testid'?: string }> = ({
  scores,
  onMoreDetails,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation();
  const metrics = METRIC_ORDER.map((key) => ({ key, label: t(METRIC_LABEL_KEYS[key]) }));

  return (
    <SectionWrapper data-testid={dataTestId}>
      <Row>
        <Title>Analysis</Title>
        {onMoreDetails && (
          <a
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: '#1976d2',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={onMoreDetails}
          >
            More details
          </a>
        )}
      </Row>
      {metrics.map(({ key, label }) => {
        const value = readScore(scores, key);
        const color = getScoreColorString(value);
        return (
          <MetricGroup key={key}>
            <MetricRow>
              <Label>{label}</Label>
              <Score>{formatScoreForDisplay(value)}</Score>
            </MetricRow>
            <BarTrack>
              <BarFill color={color} percent={value} />
            </BarTrack>
          </MetricGroup>
        );
      })}
    </SectionWrapper>
  );
};
