import {
  styleCheck,
  styleRewrite,
  getAdminConstants,
  Constants,
  StyleAnalysisSuccessResp,
  StyleAnalysisRewriteResp,
  listStyleGuides,
  StyleGuides,
  PlatformType,
  Environment,
} from '@markupai/toolkit';
import type { PlatformConfig } from '../types/content';

export function validateConfig(config: PlatformConfig | undefined): asserts config is PlatformConfig {
  if (!config?.apiKey) {
    throw new Error('Configuration is missing. Please configure the app first.');
  }
}

type StyleSettings = {
  dialect: string;
  style_guide: string;
  tone?: string;
};

const getDefaultSettings = (config: PlatformConfig): StyleSettings => {
  const payload: StyleSettings = {
    dialect: config.dialect || '',
    style_guide: config.styleGuide || '',
  };
  if (config.tone) {
    payload.tone = config.tone;
  }
  return payload;
};

// Determine platform target from Vite env variables for local development/testing
// Priority:
// 1) VITE_MARKUPAI_URL (explicit URL)
// 2) VITE_MARKUPAI_ENV (dev | stage | prod)
// Default: prod
const resolvePlatform = () => {
  const maybeUrl = import.meta.env.VITE_MARKUPAI_URL as string | undefined;
  if (maybeUrl) {
    return {
      type: PlatformType.Url as const,
      value: maybeUrl,
    };
  }

  const envValue = ((import.meta.env.VITE_MARKUPAI_ENV as string | undefined) || '').toLowerCase();
  switch (envValue) {
    case 'dev':
      return { type: PlatformType.Environment as const, value: Environment.Dev };
    case 'stage':
    case 'stg':
      return { type: PlatformType.Environment as const, value: Environment.Stage };
    case 'prod':
    case 'production':
    default:
      return { type: PlatformType.Environment as const, value: Environment.Prod };
  }
};

const withPlatform = (apiKey: string) => ({
  apiKey,
  platform: resolvePlatform(),
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
        ...withPlatform(config.apiKey),
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
        ...withPlatform(config.apiKey),
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
    return await listStyleGuides(withPlatform(config.apiKey));
  } catch (error) {
    console.error('Error fetching style guides:', error);
    throw error;
  }
}
