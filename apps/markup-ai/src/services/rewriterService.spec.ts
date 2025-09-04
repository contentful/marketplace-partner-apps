import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentCheck, rewriteContent, createInitialFieldCheck, updateFieldCheck } from './rewriterService';
import type { FieldCheckMap } from '../types/rewriter';

vi.mock('./apiService', () => ({
  checkContent: vi.fn(async () => ({ status: 'completed' })),
  contentRewrite: vi.fn(async () => ({ status: 'completed' })),
}));

import { checkContent, contentRewrite } from './apiService';

const config = { apiKey: 'k', dialect: 'en-US', tone: 'neutral', styleGuide: 'default' };

describe('rewriterService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createInitialFieldCheck returns correct structure', () => {
    const fc = createInitialFieldCheck('f1', 'text', 1);
    expect(fc.fieldId).toBe('f1');
    expect(fc.originalValue).toBe('text');
    expect(fc.isChecking).toBe(false);
  });

  it('updateFieldCheck sets and updates values', () => {
    const initial: FieldCheckMap = {};
    const updated = updateFieldCheck(initial, 'f1', { isChecking: true });
    expect(updated.f1.isChecking).toBe(true);
    const updated2 = updateFieldCheck(updated, 'f1', { isChecking: false });
    expect(updated2.f1.isChecking).toBe(false);
  });

  it('contentCheck returns success FieldCheck on success', async () => {
    const res = await contentCheck('f1', 'body', config);
    expect(checkContent).toHaveBeenCalled();
    expect(res.error).toBeNull();
    expect(res.checkResponse).toBeTruthy();
  });

  it('contentCheck returns error FieldCheck on failure', async () => {
    (checkContent as unknown as { mockRejectedValueOnce: (e: unknown) => void }).mockRejectedValueOnce(new Error('x'));
    const res = await contentCheck('f1', 'body', config);
    expect(res.error).toContain('x');
    expect(res.checkResponse).toBeNull();
  });

  it('rewriteContent returns success FieldCheck on success', async () => {
    const res = await rewriteContent('f1', 'body', config);
    expect(contentRewrite).toHaveBeenCalled();
    expect(res.error).toBeNull();
    expect(res.hasRewriteResult).toBe(true);
  });

  it('rewriteContent returns error FieldCheck on failure', async () => {
    (contentRewrite as unknown as { mockRejectedValueOnce: (e: unknown) => void }).mockRejectedValueOnce(
      new Error('y'),
    );
    const res = await rewriteContent('f1', 'body', config);
    expect(res.error).toContain('y');
    expect(res.hasRewriteResult).toBe(false);
  });
});
