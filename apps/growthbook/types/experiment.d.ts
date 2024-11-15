export interface UpdateExperimentAPIRequest {
  assignmentQueryId?: string;
  trackingKey?: string;
  name?: string; // Name of the experiment
  project?: string; // Project ID which the experiment belongs to
  hypothesis?: string; // Hypothesis of the experiment
  description?: string; // Description of the experiment
  tags?: string[];
  metrics?: string[];
  secondaryMetrics?: string[];
  guardrailMetrics?: string[];
  owner?: string; // Email of the person who owns this experiment
  archived?: boolean;
  status?: 'draft' | 'running' | 'stopped';
  autoRefresh?: boolean;
  hashAttribute?: string;
  fallbackAttribute?: string;
  hashVersion?: 1 | 2;
  disableStickyBucketing?: any;
  bucketVersion?: number;
  minBucketVersion?: number;
  releasedVariationId?: string;
  excludeFromPayload?: boolean;
  inProgressConversions?: 'loose' | 'strict';
  attributionModel?: 'firstExposure' | 'experimentDuration';
  statsEngine?: 'bayesian' | 'frequentist';
  variations?: Array<{
    id?: string;
    key: string;
    name: string;
    description?: string;
    screenshots?: Array<{
      path: string;
      width?: number;
      height?: number;
      description?: string;
    }>;
  }>;
  phases?: Array<{
    name: string;
    dateStarted: string;
    dateEnded?: string;
    reasonForStopping?: string;
    seed?: string;
    coverage?: number;
    trafficSplit?: Array<{
      variationId: string;
      weight: number;
    }>;
    namespace?: {
      namespaceId: string;
      range: [number, number];
      enabled?: boolean;
    };
    targetingCondition?: string;
    reason?: string;
    condition?: string;
    savedGroupTargeting?: Array<{
      matchType: 'all' | 'any' | 'none';
      savedGroups: string[];
    }>;
    variationWeights?: number[];
  }>;
  regressionAdjustmentEnabled?: boolean; // Controls whether regression adjustment (CUPED) is enabled for experiment analyses
}

// Similar to UpdateExperimentAPIRequest, but with a few required fields
export interface CreateExperimentAPIRequest extends UpdateExperimentAPIRequest {
  datasourceId: string;
  assignmentQueryId: string;
  trackingKey: string;
  name: string; // Name of the experiment
}

export interface ExperimentAPIResponse {
  id: string;
  dateCreated: string;
  dateUpdated: string;
  name: string;
  project: string;
  hypothesis: string;
  description: string;
  tags: string[];
  owner: string;
  archived: boolean;
  status: string;
  autoRefresh: boolean;
  hashAttribute: string;
  fallbackAttribute?: string;
  hashVersion: 1 | 2;
  disableStickyBucketing?: any;
  bucketVersion?: number;
  minBucketVersion?: number;
  variations: Array<{
    variationId: string;
    key: string;
    name: string;
    description: string;
    screenshots: string[];
  }>;
  phases: Array<{
    name: string;
    dateStarted: string;
    dateEnded: string;
    reasonForStopping: string;
    seed: string;
    coverage: number;
    trafficSplit: Array<{
      variationId: string;
      weight: number;
    }>;
    namespace?: {
      namespaceId: string;
      range: [number, number];
    };
    targetingCondition: string;
    savedGroupTargeting?: Array<{
      matchType: 'all' | 'any' | 'none';
      savedGroups: string[];
    }>;
  }>;
  settings: {
    datasourceId: string;
    assignmentQueryId: string;
    experimentId: string;
    segmentId: string;
    queryFilter: string;
    inProgressConversions: 'include' | 'exclude';
    attributionModel: 'firstExposure' | 'experimentDuration';
    statsEngine: 'bayesian' | 'frequentist';
    regressionAdjustmentEnabled?: boolean;
    goals: Array<{
      metricId: string;
      overrides: {
        delayHours?: number;
        windowHours?: number;
        window?: 'conversion' | 'lookback' | '';
        winRiskThreshold?: number;
        loseRiskThreshold?: number;
      };
    }>;
    secondaryMetrics: Array<{
      metricId: string;
      overrides: {
        delayHours?: number;
        windowHours?: number;
        window?: 'conversion' | 'lookback' | '';
        winRiskThreshold?: number;
        loseRiskThreshold?: number;
      };
    }>;
    guardrails: Array<{
      metricId: string;
      overrides: {
        delayHours?: number;
        windowHours?: number;
        window?: 'conversion' | 'lookback' | '';
        winRiskThreshold?: number;
        loseRiskThreshold?: number;
      };
    }>;
    activationMetric?: {
      metricId: string;
      overrides: {
        delayHours?: number;
        windowHours?: number;
        window?: 'conversion' | 'lookback' | '';
        winRiskThreshold?: number;
        loseRiskThreshold?: number;
      };
    };
  };
  resultSummary?: {
    status: string;
    winner: string;
    conclusions: string;
    releasedVariationId: string;
    excludeFromPayload: boolean;
  };
}
