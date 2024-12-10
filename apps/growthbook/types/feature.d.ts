export interface CreateFeatureAPIRequest {
  id: string; // A unique key name for the feature. Feature keys can only include letters, numbers, hyphens, and underscores.
  archived?: boolean; // Optional
  description?: string; // Description of the feature
  owner: string; // Email of the person who owns this experiment
  project?: string; // An associated project ID
  valueType: 'boolean' | 'string' | 'number' | 'json'; // The data type of the feature payload. Boolean by default.
  defaultValue: string; // Default value when feature is enabled. Type must match `valueType`.
  tags?: string[]; // List of associated tags
  environments?: Record<
    string,
    {
      enabled: boolean;
      rules: Array<{
        description?: string;
        condition?: string; // Applied to everyone by default.
        savedGroupTargeting?: Array<{
          matchType: 'all' | 'any' | 'none';
          savedGroups: string[];
        }>;
        id?: string;
        enabled?: boolean; // Enabled by default
        type: 'force' | 'rollout' | 'experiment-ref' | 'experiment';
        value?: string;
        coverage?: number; // Percent of traffic included in this experiment. Users not included in the experiment will skip this rule.
        hashAttribute?: string;
        trackingKey?: string;
        fallbackAttribute?: string;
        disableStickyBucketing?: any;
        bucketVersion?: number;
        minBucketVersion?: number;
        namespace?: any;
        values?: Array<{
          value: string;
          weight: number;
          name?: string;
        }>;
        variations?: Array<{
          value: string;
          variationId: string;
        }>;
        experimentId?: string;
      }>;
      definition?: string; // A JSON stringified [FeatureDefinition](#tag/FeatureDefinition_model)
      draft?: {
        enabled?: boolean;
        rules: Array<{
          description?: string;
          condition?: string; // Applied to everyone by default.
          savedGroupTargeting?: Array<{
            matchType: 'all' | 'any' | 'none';
            savedGroups: string[];
          }>;
          id?: string;
          enabled?: boolean; // Enabled by default
          type: 'force' | 'rollout' | 'experiment-ref' | 'experiment';
          value?: string;
          coverage?: number; // Percent of traffic included in this experiment. Users not included in the experiment will skip this rule.
          hashAttribute?: string;
          trackingKey?: string;
          fallbackAttribute?: string;
          disableStickyBucketing?: any;
          bucketVersion?: number;
          minBucketVersion?: number;
          namespace?: any;
          values?: Array<{
            value: string;
            weight: number;
            name?: string;
          }>;
          variations?: Array<{
            value: string;
            variationId: string;
          }>;
          experimentId?: string;
        }>;
        definition?: string; // A JSON stringified [FeatureDefinition](#tag/FeatureDefinition_model)
      };
    }
  >; // A dictionary of environments that are enabled for this feature. Keys supply the names of environments. Environments belong to organization and are not specified will be disabled by default.
  jsonSchema?: string; // Use JSON schema to validate the payload of a JSON-type feature value (enterprise only).
}

export interface UpdateFeatureAPIRequest {
  description?: string; // Description of the feature
  archived?: boolean; // Optional
  project?: string; // An associated project ID
  owner?: string; // Email of the person who owns this experiment
  defaultValue?: string; // Default value when feature is enabled. Type must match `valueType`.
  tags?: string[]; // List of associated tags. Will override tags completely with submitted list
  environments?: Record<
    string,
    {
      enabled: boolean;
      rules: Array<
        | {
            description?: string;
            condition?: string; // Applied to everyone by default.
            savedGroupTargeting?: Array<{
              matchType: 'all' | 'any' | 'none';
              savedGroups: string[];
            }>;
            id?: string;
            enabled?: boolean; // Enabled by default
            type: 'force';
            value: string;
          }
        | {
            description?: string;
            condition?: string; // Applied to everyone by default.
            savedGroupTargeting?: Array<{
              matchType: 'all' | 'any' | 'none';
              savedGroups: string[];
            }>;
            id?: string;
            enabled?: boolean; // Enabled by default
            type: 'rollout';
            value: string;
            coverage: number; // Percent of traffic included in this experiment. Users not included in the experiment will skip this rule.
            hashAttribute: string;
          }
        | {
            description?: string;
            id?: string;
            enabled?: boolean; // Enabled by default
            type: 'experiment-ref';
            condition?: string;
            variations: Array<{
              value: string;
              variationId: string;
            }>;
            experimentId: string;
          }
        | {
            description?: string;
            condition: string;
            id?: string;
            enabled?: boolean; // Enabled by default
            type: 'experiment';
            trackingKey?: string;
            hashAttribute?: string;
            fallbackAttribute?: string;
            disableStickyBucketing?: any;
            bucketVersion?: number;
            minBucketVersion?: number;
            namespace?: any;
            coverage?: number;
            values?: Array<{
              value: string;
              weight: number;
              name?: string;
            }>;
            value?: Array<{
              value: string;
              weight: number;
              name?: string;
            }>; // Support passing values under the value key as that was the original spec for FeatureExperimentRules
          }
      >;
      definition?: string; // A JSON stringified [FeatureDefinition](#tag/FeatureDefinition_model)
      draft?: {
        enabled?: boolean;
        rules: Array<
          | {
              description?: string;
              condition?: string; // Applied to everyone by default.
              savedGroupTargeting?: Array<{
                matchType: 'all' | 'any' | 'none';
                savedGroups: string[];
              }>;
              id?: string;
              enabled?: boolean; // Enabled by default
              type: 'force';
              value: string;
            }
          | {
              description?: string;
              condition?: string; // Applied to everyone by default.
              savedGroupTargeting?: Array<{
                matchType: 'all' | 'any' | 'none';
                savedGroups: string[];
              }>;
              id?: string;
              enabled?: boolean; // Enabled by default
              type: 'rollout';
              value: string;
              coverage: number; // Percent of traffic included in this experiment. Users not included in the experiment will skip this rule.
              hashAttribute: string;
            }
          | {
              description?: string;
              id?: string;
              enabled?: boolean; // Enabled by default
              type: 'experiment-ref';
              condition?: string;
              variations: Array<{
                value: string;
                variationId: string;
              }>;
              experimentId: string;
            }
          | {
              description?: string;
              condition: string;
              id?: string;
              enabled?: boolean; // Enabled by default
              type: 'experiment';
              trackingKey?: string;
              hashAttribute?: string;
              fallbackAttribute?: string;
              disableStickyBucketing?: any;
              bucketVersion?: number;
              minBucketVersion?: number;
              namespace?: any;
              coverage?: number;
              values?: Array<{
                value: string;
                weight: number;
                name?: string;
              }>;
              value?: Array<{
                value: string;
                weight: number;
                name?: string;
              }>; // Support passing values under the value key as that was the original spec for FeatureExperimentRules
            }
        >;
      }; // Use to write draft changes without publishing them.
    }
  >;
  jsonSchema?: string; // Use JSON schema to validate the payload of a JSON-type feature value (enterprise only).
}
