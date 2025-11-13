import { ScoreOutput } from '../api-client';

export type MetricKey = 'clarity' | 'grammar' | 'consistency' | 'tone' | 'terminology';

export const METRIC_ORDER: readonly MetricKey[] = ['grammar', 'consistency', 'terminology', 'clarity', 'tone'] as const;

export const METRIC_LABEL_KEYS: Record<MetricKey, string> = {
  grammar: 'grammar',
  consistency: 'consistency',
  terminology: 'terminology',
  clarity: 'clarity',
  tone: 'tone',
};

type NonNull<T> = T extends null ? never : T;

type MetricPaths = {
  clarity: NonNullable<ScoreOutput['analysis']>['clarity'];
  tone: NonNullable<ScoreOutput['analysis']>['tone'];
  grammar: NonNullable<ScoreOutput['quality']>['grammar'];
  consistency: NonNullable<ScoreOutput['quality']>['consistency'];
  terminology: NonNullable<ScoreOutput['quality']>['terminology'];
};

export type MetricDataMap = {
  [K in MetricKey]: NonNull<MetricPaths[K]>;
};

const METRIC_CONFIG = {
  clarity: {
    path: (scores: ScoreOutput) => scores.analysis?.clarity,
    details: [
      { key: 'word_count' as const, labelKey: 'word_count' },
      { key: 'sentence_count' as const, labelKey: 'sentence_count' },
      { key: 'average_sentence_length' as const, labelKey: 'average_sentence_length' },
      { key: 'sentence_complexity' as const, labelKey: 'sentence_complexity' },
      { key: 'vocabulary_complexity' as const, labelKey: 'vocabulary_complexity' },
      { key: 'flesch_reading_ease' as const, labelKey: 'flesch_reading_ease' },
    ],
  },
  tone: {
    path: (scores: ScoreOutput) => scores.analysis?.tone,
    details: [
      { key: 'informality' as const, labelKey: 'informality' },
      { key: 'liveliness' as const, labelKey: 'liveliness' },
    ],
  },
  grammar: {
    path: (scores: ScoreOutput) => scores.quality?.grammar,
    details: [],
  },
  consistency: {
    path: (scores: ScoreOutput) => scores.quality?.consistency,
    details: [],
  },
  terminology: {
    path: (scores: ScoreOutput) => scores.quality?.terminology,
    details: [],
  },
} as const;

export function getMetricDetails<K extends MetricKey>(
  key: K,
): Array<{ key: keyof MetricDataMap[K]; labelKey: string }> {
  return [...METRIC_CONFIG[key].details] as Array<{ key: keyof MetricDataMap[K]; labelKey: string }>;
}

export function getMetricScore(scores: ScoreOutput | undefined, key: MetricKey): number {
  if (!scores) return 0;
  const metric = METRIC_CONFIG[key].path(scores);
  return Number(metric?.score ?? 0);
}

export function getMetricIssues(scores: ScoreOutput | undefined, key: MetricKey): number | undefined {
  if (!scores) return undefined;
  const metric = METRIC_CONFIG[key].path(scores);
  // Only quality metrics have issues property
  if (key === 'grammar' || key === 'consistency' || key === 'terminology') {
    const issues = (metric as { issues?: number | null })?.issues;
    return issues === null ? undefined : issues;
  }
  return undefined;
}

export function getMetricDataSource(
  scores: ScoreOutput | undefined,
  key: MetricKey,
): MetricDataMap[MetricKey] | undefined {
  if (!scores) return undefined;
  const metric = METRIC_CONFIG[key].path(scores);
  return metric === null ? undefined : metric;
}
