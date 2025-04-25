export const KLAVIYO_API_BASE_URL = 'https://a.klaviyo.com/api';
export const API_PROXY_URL = process.env.NODE_ENV === 'production' 
  ? '/api/klaviyo/proxy'
  : 'http://localhost:3001/api/klaviyo/proxy';

export interface KlaviyoConfig {
  apiKey: string;
  companyId: string;
}

export interface FieldMapping {
  contentfulFieldId: string;
  klaviyoBlockName: string;
  fieldType: 'text' | 'image' | 'entry' | 'reference-array';
}

export interface EntryConfig {
  entryId: string;
  mappings: FieldMapping[];
}

export const MAX_FIELD_MAPPINGS = 25; 