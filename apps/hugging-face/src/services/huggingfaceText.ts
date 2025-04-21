import { HfInference } from '@huggingface/inference';
import { AppInstallationParameters } from '../locations/ConfigScreen';

const SYSTEM_PROMPT = `You are an advanced marketing prompt engineer specializing in photorealistic image generation. Transform any user-submitted image prompt into a concise, best-practice prompt that includes realistic details, lighting, composition, environment context, and camera settings. Your final output must be only the refined prompt itself without any additional explanation or formatting.`;

export async function refinePrompt(prompt: string, parameters: AppInstallationParameters): Promise<string> {
  if (!parameters.huggingfaceApiKey || !parameters.textModelId) {
    throw new Error('Missing API key or text model ID configuration');
  }

  const client = new HfInference(parameters.huggingfaceApiKey);

  try {
    const chatCompletion = await client.chatCompletion({
      model: parameters.textModelId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 2048,
      top_p: 0.7
    });

    if (!chatCompletion.choices[0].message.content) {
      throw new Error('No content in response');
    }

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error refining prompt:', error);
    throw new Error('Failed to refine prompt with text model');
  }
} 