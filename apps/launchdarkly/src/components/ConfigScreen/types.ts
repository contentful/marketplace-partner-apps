/**
 * LaunchDarkly Project representation
 */
export interface Project {
  key: string;
  name: string;
  environments: Environment[];
}

/**
 * LaunchDarkly Environment representation
 */
export interface Environment {
  key: string;
  name: string;
  color?: string;
  default?: boolean;
}

/**
 * App installation parameters
 * Note: API key is NOT stored in Contentful parameters for security
 * It is stored server-side in encrypted DynamoDB
 */
export interface AppInstallationParameters {
  launchDarklyProjectKey?: string;
  launchDarklyEnvironment?: string;
  launchDarklyProjectName?: string;
  launchDarklyEnvironmentName?: string;
  launchDarklyBaseUrl?: string;
  isRegistered?: boolean;
  apiKeyLastFour?: string;
}

