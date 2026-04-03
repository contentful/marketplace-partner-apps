import { google, type GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { createVertex, type GoogleVertexProvider } from "@ai-sdk/google-vertex";

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const USE_VERTEX =
  parseBoolean(process.env.GOOGLE_GENAI_USE_VERTEXAI) ||
  Boolean(process.env.GOOGLE_VERTEX_PROJECT);

const vertexProvider: GoogleVertexProvider | null = USE_VERTEX
  ? createVertex({
      project: process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION || "global",
    })
  : null;

const googleProvider: GoogleGenerativeAIProvider = google;

export function languageModel(modelId: string) {
  return vertexProvider ? vertexProvider(modelId) : googleProvider(modelId);
}

export function textEmbeddingModel(modelId: string) {
  return vertexProvider
    ? vertexProvider.textEmbeddingModel(modelId)
    : googleProvider.textEmbeddingModel(modelId);
}

export function supportsVertex(): boolean {
  return Boolean(vertexProvider);
}

export function getGoogleProviderLabel(): string {
  return vertexProvider ? "google-vertex" : "google-ai-studio";
}
