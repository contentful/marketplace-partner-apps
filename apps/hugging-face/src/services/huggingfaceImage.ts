import { InferenceClient, InferenceProvider } from '@huggingface/inference';
import { AppInstallationParameters } from '../utils/types';

export async function generateImage(prompt: string, parameters: AppInstallationParameters, refinedPrompt?: string): Promise<Blob> {
  if (!parameters.huggingfaceApiKey || !parameters.imageModelId || !parameters.imageModelInferenceProvider) {
    throw new Error('Missing API key or model ID configuration or inference provider');
  }

  const client = new InferenceClient(parameters.huggingfaceApiKey);

  const finalPrompt = refinedPrompt || prompt;

  try {
    const image = await client.textToImage(
      {
        provider: parameters.imageModelInferenceProvider as InferenceProvider,
        model: parameters.imageModelId,
        inputs: finalPrompt,
        parameters: {
          num_inference_steps: parameters.imageNumInferenceSteps ?? 50,
          height: parameters.imageHeight ?? 1024,
          width: parameters.imageWidth ?? 1024,
          guidance_scale: parameters.imageGuidanceScale ?? 3.5,
          max_sequence_length: parameters.imageMaxSequenceLength ?? 512,
        },
      },
      {
        outputType: 'blob',
      }
    );

    return image;
  } catch (error) {
    const errorMessage = (error as any)?.message?.includes('exceeded')
      ? 'You have exceeded your monthly included Hugging Face credits.'
      : 'Error: failed to load image. Please try again.';
    throw new Error(errorMessage);
  }
}
