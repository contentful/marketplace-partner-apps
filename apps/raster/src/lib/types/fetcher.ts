import type { Settings } from './settings';

export type Fetcher = {
  query: string;
  variables: Record<string, string>;
  settings: Settings;
};
