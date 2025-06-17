/**
 * Currently Vertex AI API only supports a limited number of generative models, and it varies per region.
 * We have not found an official API endpoint to generate this list, so we have to manually maintain it
 * for the moment.
 *
 * FIXME: Find an official Google endpoint which returns the list of generative models available via Vertex AI API
 */
export const VERTEX_AI_KNOWN_AVAILABLE_MODELS: Record<string, string[]> = {
  'us-east5': [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-001',
  ],
  'us-south1': [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
  ],
  'us-central1': [
    'models/gemini-2.0-flash-exp',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.5-pro-preview-03-25',
    'models/gemini-2.5-pro-preview-05-06',
    'models/gemini-2.5-flash-preview-05-20',
    'models/gemini-2.5-flash-preview-04-17',
  ],
  'us-west4': [
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
  ],
  'us-east1': [
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
  ],
  'us-east4': [
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-001',
  ],
  'us-west1': [
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash-lite-001',
  ],
  'northamerica-northeast1': [
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-pro-002',
  ],
  'europe-west1': [
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash-lite',
  ],
  'europe-north1': [
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-lite',
  ],
  'europe-west3': [
    'models/gemini-1.5-pro-002',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
  ],
  'europe-west2': [
    'models/gemini-1.5-pro-002',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
  ],
  'europe-southwest1': [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-001',
  ],
  'europe-west8': [
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-lite-001',
  ],
  'europe-west4': [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite-001',
  ],
  'europe-west9': [
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-001',
  ],
  'europe-central2': [
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite-001',
  ],
  'asia-south1': [
    'models/gemini-1.5-pro-002',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
  ],
  'asia-northeast1': [
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-pro-002',
  ],
  'australia-southeast1': [
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-pro-002',
  ],
}
