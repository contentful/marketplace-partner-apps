import { AppInstallationParameters } from '../locations/ConfigScreen';

export async function generateImage(
  prompt: string,
  parameters: AppInstallationParameters,
  refinedPrompt?: string
): Promise<Blob> {
  if (!parameters.huggingfaceApiKey || !parameters.imageModelId) {
    throw new Error('Missing API key or model ID configuration');
  }

  const finalPrompt = refinedPrompt || prompt;

  const response = await fetch(`https://api-inference.huggingface.co/models/${parameters.imageModelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${parameters.huggingfaceApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: finalPrompt }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  return response.blob();
} 