export type AppInstallationParameters =
  | ({ modelProvider: 'google-gemini' } & GoogleGeminiInstallationParameters)
  | ({ modelProvider: 'google-vertex-ai' } & VertexAIInstallationParameters)

export interface GoogleGeminiInstallationParameters {
  apiKey: string
  selectedModels?: string
}

export interface VertexAIInstallationParameters {
  credentials: string
  location: string
  selectedModels?: string
}

/**
 * 'google-gemini' corresponds to the Gemini API (aka Google Generative AI API)
 * 'google-vertex-ai' is the GCP Vertex AI API
 */
export type ModelProvider = 'google-gemini' | 'google-vertex-ai'
