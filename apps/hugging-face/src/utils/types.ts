import { InferenceProvider } from '@huggingface/inference';

export interface AppInstallationParameters {
  huggingfaceApiKey?: string;
  textModelId?: string;
  imageModelId?: string;
  textModelInferenceProvider?: InferenceProvider | string;
  imageModelInferenceProvider?: InferenceProvider | string;
}
