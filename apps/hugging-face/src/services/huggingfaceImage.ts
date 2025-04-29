import { InferenceClient } from '@huggingface/inference';
import { AppInstallationParameters } from '../utils/types';

export async function generateImage(prompt: string, parameters: AppInstallationParameters, refinedPrompt?: string): Promise<Blob> {
  if (!parameters.huggingfaceApiKey || !parameters.imageModelId || !parameters.imageModelInferenceProvider) {
    throw new Error('Missing API key or model ID configuration or inference provider');
  }

  const client = new InferenceClient(parameters.huggingfaceApiKey);

  const finalPrompt = refinedPrompt || prompt;

  try {
    const image = await client.textToImage({
      provider: parameters.imageModelInferenceProvider,
      model: parameters.imageModelId,
      inputs: finalPrompt,
      parameters: { num_inference_steps: 5 },
    });

    return image;
  } catch (error) {
    throw new Error('Failed to generate image with image model');
  }
}
