import React, { useMemo, useState } from 'react';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import {
  DialogContainer,
  DialogDivider,
  DialogContent,
  TopGrid,
  QualityCard,
  QualityTitle,
  QualityValue,
  MetricSection,
  MetricHeader,
  MetricScore,
  MetricBarTrack,
  MetricBarFill,
  MetricLabel,
  AnalysisConfigCard,
  AnalysisConfigGrid,
  AnalysisConfigItem,
  AnalysisConfigLabel,
  AnalysisConfigValue,
  MetricDetailsGrid,
  MetricDetailsRow,
  IssuesNumber,
  BottomActions,
  CopyWorkflowIdButton,
} from './MoreDetailsDialog.styles';
import { StyleAnalysisSuccessResp, StyleAnalysisRewriteResp, StyleScores } from '@markupai/toolkit';
import { useTranslation } from '../../contexts/LocalizationContext';
import { CopyIcon, CheckCircleIcon } from '@contentful/f36-icons';

import { getScoreColorString, getScoreColorStringSoft } from '../../utils/scoreColors';
import {
  METRIC_ORDER,
  METRIC_LABEL_KEYS,
  getMetricDetails,
  getMetricDataSource,
  getMetricIssues,
  getMetricScore,
  MetricDataMap,
  MetricKey,
} from '../../constants/metrics';

const CONFIG_KEYS = {
  style_guide: 'style_guide',
  dialect: 'dialect',
  tone: 'tone',
} as const;
type TranslatableConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

const CLARITY_KEY: MetricKey = 'clarity';
const TONE_KEY: MetricKey = 'tone';

const ISSUE_METRIC_KEYS: ReadonlySet<MetricKey> = new Set<MetricKey>(['grammar', 'consistency', 'terminology']);

export const MoreDetailsDialog: React.FC = () => {
  useAutoResizer();
  const sdk = useSDK<DialogAppSDK>();
  const { checkResponse } = sdk.parameters.invocation as unknown as {
    checkResponse: StyleAnalysisSuccessResp | StyleAnalysisRewriteResp;
  };
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const scores = useMemo<StyleScores | undefined>(
    () =>
      'rewrite' in checkResponse
        ? (checkResponse as StyleAnalysisRewriteResp).rewrite.scores
        : (checkResponse as StyleAnalysisSuccessResp).original.scores,
    [checkResponse],
  );

  type QualityScoreLike = { quality?: { score?: number } };
  const qualityScore = useMemo(() => Number((scores as QualityScoreLike | undefined)?.quality?.score ?? 0), [scores]);

  const orderedMetrics = useMemo(
    () =>
      METRIC_ORDER.map((key) => ({
        key,
        label: t(METRIC_LABEL_KEYS[key]),
      })),
    [t],
  );

  // Helper function to get display value for configuration items
  const getConfigDisplayValue = (key: TranslatableConfigKey, value: string | undefined): string => {
    if (!value) return '-';

    // Handle special cases for better display
    switch (key) {
      case CONFIG_KEYS.style_guide:
        return t(value) || value;
      case CONFIG_KEYS.dialect:
        return t(value) || value;
      case CONFIG_KEYS.tone:
        return t(value) || value;
      default:
        return value;
    }
  };

  return (
    <DialogContainer>
      <DialogDivider />
      <DialogContent>
        <TopGrid>
          <QualityCard bg={getScoreColorStringSoft(qualityScore)}>
            <QualityTitle>Quality Score</QualityTitle>
            <QualityValue>{Math.round(qualityScore)}</QualityValue>
          </QualityCard>
          <AnalysisConfigCard>
            <AnalysisConfigGrid>
              <AnalysisConfigItem>
                <AnalysisConfigLabel>{t('style_guide_type')}</AnalysisConfigLabel>
                <AnalysisConfigValue>
                  {getConfigDisplayValue(CONFIG_KEYS.style_guide, checkResponse.config.style_guide.style_guide_type)}
                </AnalysisConfigValue>
              </AnalysisConfigItem>
              <AnalysisConfigItem>
                <AnalysisConfigLabel>{t('dialect')}</AnalysisConfigLabel>
                <AnalysisConfigValue>
                  {getConfigDisplayValue(CONFIG_KEYS.dialect, checkResponse.config.dialect)}
                </AnalysisConfigValue>
              </AnalysisConfigItem>
              <AnalysisConfigItem>
                <AnalysisConfigLabel>{t('tone')}</AnalysisConfigLabel>
                <AnalysisConfigValue>
                  {getConfigDisplayValue(CONFIG_KEYS.tone, checkResponse.config.tone)}
                </AnalysisConfigValue>
              </AnalysisConfigItem>
            </AnalysisConfigGrid>
          </AnalysisConfigCard>
        </TopGrid>

        {/* Section title removed as requested */}

        {orderedMetrics.map((metric) => {
          const score = getMetricScore(scores, metric.key);
          const color = getScoreColorString(score);
          const metricData = getMetricDataSource(scores, metric.key);
          const issuesCount = getMetricIssues(scores, metric.key);

          return (
            <MetricSection key={metric.key}>
              <MetricHeader>
                <span>
                  <MetricLabel>{metric.label}</MetricLabel>
                </span>
                <MetricScore>{Math.round(score)}</MetricScore>
              </MetricHeader>
              <MetricBarTrack>
                <MetricBarFill color={color} percent={score} />
              </MetricBarTrack>
              {/* Compact sub-details */}
              {metric.key === CLARITY_KEY && metricData && (
                <MetricDetailsGrid>
                  {getMetricDetails('clarity').map(({ key: detailKey, labelKey }) => {
                    const clarity = metricData as MetricDataMap['clarity'];
                    return (
                      <MetricDetailsRow key={`clarity-${String(detailKey)}`}>
                        <span>{t(labelKey)}</span>
                        <span>{clarity?.[detailKey] ?? '-'}</span>
                      </MetricDetailsRow>
                    );
                  })}
                </MetricDetailsGrid>
              )}
              {ISSUE_METRIC_KEYS.has(metric.key) && metric.key !== CLARITY_KEY && metric.key !== TONE_KEY && (
                <MetricDetailsGrid>
                  <MetricDetailsRow>
                    <span>Issues Detected</span>
                    <IssuesNumber>{issuesCount ?? 0}</IssuesNumber>
                  </MetricDetailsRow>
                </MetricDetailsGrid>
              )}
              {metric.key === TONE_KEY && metricData && (
                <MetricDetailsGrid>
                  {getMetricDetails('tone').map(({ key: detailKey, labelKey }) => {
                    const tone = metricData as MetricDataMap['tone'];
                    return (
                      <MetricDetailsRow key={`tone-${String(detailKey)}`}>
                        <span>{t(labelKey)}</span>
                        <span>{tone?.[detailKey] ?? '-'}</span>
                      </MetricDetailsRow>
                    );
                  })}
                </MetricDetailsGrid>
              )}
            </MetricSection>
          );
        })}
        <BottomActions>
          {'workflow' in checkResponse && checkResponse.workflow.id && (
            <CopyWorkflowIdButton
              onClick={async () => {
                const id = checkResponse.workflow.id!;
                try {
                  await navigator.clipboard.writeText(id);
                } catch {
                  // no-op if clipboard not available
                }
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              aria-label="Copy workflow id"
              title="Copy workflow id"
              data-testid="copy-workflow-id-button"
            >
              {copied ? <CheckCircleIcon size="small" /> : <CopyIcon size="small" />}
              Workflow ID
            </CopyWorkflowIdButton>
          )}
        </BottomActions>
      </DialogContent>
    </DialogContainer>
  );
};

export default React.memo(MoreDetailsDialog);
