import { StyleScores } from '@markupai/toolkit';

export type MetricKey = 'clarity' | 'grammar' | 'consistency' | 'tone' | 'terminology';

export const METRIC_ORDER: readonly MetricKey[] = ['grammar', 'consistency', 'terminology', 'clarity', 'tone'] as const;

export const METRIC_LABEL_KEYS: Record<MetricKey, string> = {
  grammar: 'grammar',
  consistency: 'consistency',
  terminology: 'terminology',
  clarity: 'clarity',
  tone: 'tone',
};

export type MetricDataMap = {
  clarity: StyleScores['analysis']['clarity'];
  tone: StyleScores['analysis']['tone'];
  grammar: StyleScores['quality']['grammar'];
  consistency: StyleScores['quality']['consistency'];
  terminology: StyleScores['quality']['terminology'];
};

export function getMetricDetails<K extends MetricKey>(
  key: K,
): Array<{ key: keyof MetricDataMap[K]; labelKey: string }> {
  switch (key) {
    case 'clarity':
      return [
        { key: 'word_count' as keyof MetricDataMap['clarity'], labelKey: 'word_count' },
        { key: 'sentence_count' as keyof MetricDataMap['clarity'], labelKey: 'sentence_count' },
        { key: 'average_sentence_length' as keyof MetricDataMap['clarity'], labelKey: 'average_sentence_length' },
        { key: 'sentence_complexity' as keyof MetricDataMap['clarity'], labelKey: 'sentence_complexity' },
        { key: 'vocabulary_complexity' as keyof MetricDataMap['clarity'], labelKey: 'vocabulary_complexity' },
        { key: 'flesch_reading_ease' as keyof MetricDataMap['clarity'], labelKey: 'flesch_reading_ease' },
      ] as Array<{ key: keyof MetricDataMap['clarity']; labelKey: string }> as unknown as Array<{
        key: keyof MetricDataMap[K];
        labelKey: string;
      }>;
    case 'tone':
      return [
        { key: 'informality' as keyof MetricDataMap['tone'], labelKey: 'informality' },
        { key: 'liveliness' as keyof MetricDataMap['tone'], labelKey: 'liveliness' },
      ] as Array<{ key: keyof MetricDataMap['tone']; labelKey: string }> as unknown as Array<{
        key: keyof MetricDataMap[K];
        labelKey: string;
      }>;
    default:
      return [] as Array<{ key: keyof MetricDataMap[K]; labelKey: string }>;
  }
}

export function getMetricScore(scores: StyleScores | undefined, key: MetricKey): number {
  if (!scores) return 0;
  switch (key) {
    case 'clarity':
      return Number(scores.analysis?.clarity?.score ?? 0);
    case 'tone':
      return Number(scores.analysis?.tone?.score ?? 0);
    case 'grammar':
      return Number(scores.quality?.grammar?.score ?? 0);
    case 'consistency':
      return Number(scores.quality?.consistency?.score ?? 0);
    case 'terminology':
      return Number(scores.quality?.terminology?.score ?? 0);
    default:
      return 0;
  }
}

export function getMetricIssues(scores: StyleScores | undefined, key: MetricKey): number | undefined {
  if (!scores) return undefined;
  switch (key) {
    case 'grammar':
      return scores.quality?.grammar?.issues;
    case 'consistency':
      return scores.quality?.consistency?.issues;
    case 'terminology':
      return scores.quality?.terminology?.issues;
    default:
      return undefined;
  }
}

export function getMetricDataSource(
  scores: StyleScores | undefined,
  key: MetricKey,
): MetricDataMap[MetricKey] | undefined {
  if (!scores) return undefined;
  switch (key) {
    case 'clarity':
      return scores.analysis?.clarity;
    case 'tone':
      return scores.analysis?.tone;
    case 'grammar':
      return scores.quality?.grammar;
    case 'consistency':
      return scores.quality?.consistency;
    case 'terminology':
      return scores.quality?.terminology;
    default:
      return undefined;
  }
}
