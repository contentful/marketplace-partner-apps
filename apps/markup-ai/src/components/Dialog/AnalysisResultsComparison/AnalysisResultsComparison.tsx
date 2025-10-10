import React from 'react';
import { Container } from './AnalysisResultsComparison.styles';
import { ComparisonCard } from '../ComparisonCard/ComparisonCard';
import { StyleScores } from '@markupai/toolkit';
import { useTranslation } from '../../../contexts/LocalizationContext';
import { METRIC_ORDER, METRIC_LABEL_KEYS, getMetricScore } from '../../../constants/metrics';

interface AnalysisResultsComparisonProps {
  initial: StyleScores;
  improved: StyleScores;
}

export const AnalysisResultsComparison: React.FC<AnalysisResultsComparisonProps> = ({ initial, improved }) => {
  const initialScores = initial;
  const improvedScores = improved;
  const { t } = useTranslation();

  const metrics = METRIC_ORDER.map((key) => ({ key, label: t(METRIC_LABEL_KEYS[key]) }));

  return (
    <Container>
      {metrics.map(({ key, label }) => (
        <ComparisonCard
          key={key}
          label={label}
          initialValue={getMetricScore(initialScores, key)}
          improvedValue={getMetricScore(improvedScores, key)}
        />
      ))}
    </Container>
  );
};
