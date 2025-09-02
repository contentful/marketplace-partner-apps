import {
  styleCheck,
  styleRewrite,
  getAdminConstants,
  Constants,
  StyleAnalysisSuccessResp,
  StyleAnalysisRewriteResp,
  listStyleGuides,
  StyleGuides,
} from '@markupai/toolkit';
import type { PlatformConfig } from '../types/content';

export function validateConfig(config: PlatformConfig | undefined): asserts config is PlatformConfig {
  if (!config?.apiKey) {
    throw new Error('Configuration is missing. Please configure the app first.');
  }
}

const getDefaultSettings = (config: PlatformConfig) => ({
  dialect: config.dialect || '',
  tone: config.tone || '',
  style_guide: config.styleGuide || '',
});

export async function checkContent(content: string, config: PlatformConfig): Promise<StyleAnalysisSuccessResp> {
  validateConfig(config);
  try {
    const response = await styleCheck(
      {
        content,
        ...getDefaultSettings(config),
      },
      {
        apiKey: config.apiKey,
      },
    );
    return response;
  } catch (error) {
    console.error('Error checking content:', error);
    throw error;
  }
}

export async function contentRewrite(content: string, config: PlatformConfig): Promise<StyleAnalysisRewriteResp> {
  validateConfig(config);
  try {
    const response = await styleRewrite(
      {
        content,
        ...getDefaultSettings(config),
      },
      {
        apiKey: config.apiKey,
      },
    );
    return response;
  } catch (error) {
    console.error('Error rewriting content:', error);
    throw error;
  }
}

export async function fetchAdminConstants(config: PlatformConfig): Promise<Constants> {
  validateConfig(config);
  return await getAdminConstants();
}

export async function fetchStyleGuides(config: PlatformConfig): Promise<StyleGuides> {
  validateConfig(config);
  try {
    return await listStyleGuides({
      apiKey: config.apiKey,
    });
  } catch (error) {
    console.error('Error fetching style guides:', error);
    throw error;
  }
}
