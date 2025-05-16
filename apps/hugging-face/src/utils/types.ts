import { InferenceProvider } from '@huggingface/inference';

export interface AppInstallationParameters {
  huggingfaceApiKey?: string;
  textModelId?: string;
  imageModelId?: string;
  textModelInferenceProvider?: InferenceProvider;
  imageModelInferenceProvider?: InferenceProvider;
  imageNumInferenceSteps?: number;
  imageHeight?: number;
  imageWidth?: number;
  imageGuidanceScale?: number;
  imageMaxSequenceLength?: number;
}
