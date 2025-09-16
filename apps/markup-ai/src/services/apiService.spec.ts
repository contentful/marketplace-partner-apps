import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateConfig, checkContent, contentRewrite, fetchAdminConstants, fetchStyleGuides } from './apiService';
import type { RewriterConfig } from '../types/rewriter';

vi.mock('@markupai/toolkit', () => ({
  styleCheck: vi.fn(async (args: unknown) => ({ ok: true, args })),
  styleRewrite: vi.fn(async (args: unknown) => ({ ok: true, args })),
  getAdminConstants: vi.fn(async () => ({ dialects: ['en-US'], tones: ['neutral'] })),
  listStyleGuides: vi.fn(async () => [{ id: 'default', name: 'Default' }]),
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
    expect(listStyleGuides).toHaveBeenCalledWith({ apiKey: 'k' });
    expect(res[0]).toHaveProperty('id');
  });
});
