import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateConfig, checkContent, contentRewrite, fetchAdminConstants, fetchStyleGuides } from './apiService';
import type { RewriterConfig } from '../types/rewriter';

vi.mock('@markupai/toolkit', () => ({
  styleCheck: vi.fn(async (args: unknown) => ({ ok: true, args })),
  styleRewrite: vi.fn(async (args: unknown) => ({ ok: true, args })),
  getAdminConstants: vi.fn(async () => ({ dialects: ['en-US'], tones: ['neutral'] })),
  listStyleGuides: vi.fn(async () => [{ id: 'default', name: 'Default' }]),
  PlatformType: {
    Environment: 'environment',
    Url: 'url',
  },
  Environment: {
    Dev: 'dev',
    Stage: 'stage',
    Prod: 'prod',
  },
}));

import { styleCheck, styleRewrite, getAdminConstants, listStyleGuides } from '@markupai/toolkit';

const validConfig = { apiKey: 'k', dialect: 'en-US', tone: 'neutral', styleGuide: 'default' };

describe('apiService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validateConfig throws without apiKey', () => {
    expect(() => validateConfig(undefined)).toThrow();
    const invalid: RewriterConfig = { apiKey: '' };
    expect(() => validateConfig(invalid)).toThrow();
  });

  it('checkContent calls styleCheck with defaults and apiKey', async () => {
    const res = await checkContent('hello', validConfig);
    expect(styleCheck).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  it('checkContent propagates errors', async () => {
    (styleCheck as unknown as { mockRejectedValueOnce: (e: unknown) => void }).mockRejectedValueOnce(new Error('boom'));
    await expect(checkContent('hello', validConfig)).rejects.toThrow('boom');
  });

  it('contentRewrite calls styleRewrite with defaults and apiKey', async () => {
    const res = await contentRewrite('hello', validConfig);
    expect(styleRewrite).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  it('contentRewrite propagates errors', async () => {
    (styleRewrite as unknown as { mockRejectedValueOnce: (e: unknown) => void }).mockRejectedValueOnce(
      new Error('oops'),
    );
    await expect(contentRewrite('hello', validConfig)).rejects.toThrow('oops');
  });

  it('fetchAdminConstants calls underlying SDK', async () => {
    const res = await fetchAdminConstants(validConfig);
    expect(getAdminConstants).toHaveBeenCalled();
    expect(res).toHaveProperty('dialects');
  });

  it('fetchStyleGuides calls underlying SDK with apiKey', async () => {
    const res = await fetchStyleGuides(validConfig);
    expect(listStyleGuides).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'k', platform: expect.any(Object) }),
    );
    expect(res[0]).toHaveProperty('id');
  });

  describe('platform resolution via env', () => {
    it('uses explicit URL when VITE_MARKUPAI_URL is set', async () => {
      vi.stubEnv('VITE_MARKUPAI_URL', 'https://api.dev.markup.ai');
      vi.stubEnv('VITE_MARKUPAI_ENV', 'prod'); // should be ignored

      await fetchStyleGuides(validConfig);

      expect(listStyleGuides).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'k',
          platform: { type: 'url', value: 'https://api.dev.markup.ai' },
        }),
      );
      vi.unstubAllEnvs();
    });

    it('uses environment when VITE_MARKUPAI_ENV=dev', async () => {
      vi.unstubAllEnvs();
      vi.stubEnv('VITE_MARKUPAI_URL', '');
      vi.stubEnv('VITE_MARKUPAI_ENV', 'dev');

      await fetchStyleGuides(validConfig);

      expect(listStyleGuides).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'k',
          platform: { type: 'environment', value: 'dev' },
        }),
      );
      vi.unstubAllEnvs();
    });

    it('maps VITE_MARKUPAI_ENV=stg to stage', async () => {
      vi.unstubAllEnvs();
      vi.stubEnv('VITE_MARKUPAI_URL', '');
      vi.stubEnv('VITE_MARKUPAI_ENV', 'stg');

      await fetchStyleGuides(validConfig);

      expect(listStyleGuides).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'k',
          platform: { type: 'environment', value: 'stage' },
        }),
      );
      vi.unstubAllEnvs();
    });

    it('defaults to prod when no env vars are set', async () => {
      vi.unstubAllEnvs();
      // ensure both are empty strings so URL branch is skipped and env is blank
      vi.stubEnv('VITE_MARKUPAI_URL', '');
      vi.stubEnv('VITE_MARKUPAI_ENV', '');

      await fetchStyleGuides(validConfig);

      expect(listStyleGuides).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'k',
          platform: { type: 'environment', value: 'prod' },
        }),
      );
      vi.unstubAllEnvs();
    });
  });
});
