// LaunchDarkly Type Definitions
// Ported from launchdarkly-contentful-app-oldish

// Base variation type that works with LaunchDarkly
export const VARIATION_TYPES = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  NUMBER: 'number',
  JSON: 'json'
} as const;

export type VariationType = typeof VARIATION_TYPES[keyof typeof VARIATION_TYPES];

// Flag modes
export type FlagMode = 'new' | 'existing' | null;

// Rollout strategies
export type RolloutStrategy = 'percentage' | 'user-segment' | 'scheduled';

// Variation value types based on VariationType
export type VariationValue = boolean | string | number | object;

// Feature Flag Types
export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  kind: VariationType;
  variations: Array<{ value: VariationValue; name: string }>;
  defaultVariation: number;
  tags?: string[];
  temporary?: boolean;
  environments?: Record<string, { on: boolean }>;
  mode?: FlagMode;
  rolloutStrategy?: RolloutStrategy;
  rolloutConfig?: {
    percentage?: number;
    userSegments?: string[];
    startDate?: string;
    endDate?: string;
  };
  scheduledRelease?: {
    enabled: boolean;
    releaseDate: string;
    environments: string[];
  };
  previewSettings?: {
    enablePreviewFlags: boolean;
    previewEnvironment: string;
    autoCreatePreviewFlags: boolean;
  };
  dependencies?: string[]; // Array of flag keys
}

export interface CreateFlagData {
  name: string;
  key: string;
  description?: string;
  kind: VariationType;
  variations: Array<{
    name: string;
    value: VariationValue;
  }>;
  tags?: string[];
  temporary?: boolean;
  mode?: FlagMode;
  rolloutStrategy?: RolloutStrategy;
  rolloutConfig?: {
    percentage?: number;
    userSegments?: string[];
    startDate?: string;
    endDate?: string;
  };
  scheduledRelease?: {
    enabled: boolean;
    releaseDate: string;
    environments: string[];
  };
  previewSettings?: {
    enablePreviewFlags: boolean;
    previewEnvironment: string;
    autoCreatePreviewFlags: boolean;
  };
  dependencies?: string[];
  clientSideAvailability?: {
    usingEnvironmentId: boolean;
    usingMobileKey: boolean;
  };
}

export interface PatchOperation {
  op: 'replace' | 'add' | 'remove';
  path: string;
  value?: VariationValue;
}

// Project and Environment Types
export interface Project {
  key: string;
  name: string;
  _links: {
    self: {
      href: string;
    };
  };
}

export interface Environment {
  key: string;
  name: string;
  color: string;
  _links: {
    self: {
      href: string;
    };
  };
}

// Experiment Types
export interface Experiment {
  key: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RUNNING' | 'STOPPED' | 'ARCHIVED';
  variations: Array<{
    name: string;
    value: VariationValue;
  }>;
  baselineVariation?: string;
  audience?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  results?: ExperimentResults;
  winner?: string;
  tags?: string[];
}

export interface CreateExperimentData {
  name: string;
  key: string;
  description?: string;
  variations: Array<{
    name: string;
    value: VariationValue;
  }>;
  baselineVariation?: string;
  audience?: Record<string, unknown>;
  tags?: string[];
}

export interface ExperimentResults {
  metrics: Array<{
    name: string;
    value: number;
    confidenceInterval?: {
      lower: number;
      upper: number;
    };
  }>;
  variations: Record<string, {
    sampleSize: number;
    conversionRate: number;
  }>;
}

export interface Metric {
  key: string;
  name: string;
  description?: string;
  kind: 'count' | 'numeric' | 'boolean';
  selector?: string;
  tags?: string[];
}

// API Response Types
export interface LaunchDarklyResponse<T> {
  items: T[];
  totalCount: number;
  limit: number;
  offset: number;
}

// Error Types
export interface LaunchDarklyError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Utility Functions
export const formatError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export const validateFlagKey = (key: string): boolean => {
  // LaunchDarkly key validation rules
  const keyRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*$/;
  return keyRegex.test(key) && key.length <= 100;
};

export const validateFlagName = (name: string): boolean => {
  return name.length > 0 && name.length <= 100;
};

export const validateVariationValue = (value: unknown, type: VariationType): boolean => {
  switch (type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'json':
      try {
        if (typeof value === 'object' && value !== null) return true;
        if (typeof value === 'string') {
          JSON.parse(value);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    default:
      return false;
  }
};

export interface LaunchDarklyAPI {
  getFeatureFlagsForProject(projectKey: string): Promise<{ items: Array<{ key: string; name: string }> }>;
} 