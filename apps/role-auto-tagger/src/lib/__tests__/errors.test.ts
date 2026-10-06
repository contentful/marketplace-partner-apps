import { describe, expect, it } from 'vitest';
import { describeError } from '../errors';

describe('describeError', () => {
  it('reads an Error', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
  });

  it('reads a plain object, which is what the browser CMA client rejects with', () => {
    expect(describeError({ status: 403, statusText: 'Forbidden', details: { reasons: ['no access'] } })).toBe('403 Forbidden: no access');
  });

  it('unwraps a JSON-encoded message and keeps the request ID', () => {
    const message = JSON.stringify({
      status: 422,
      statusText: 'Unprocessable Entity',
      details: { errors: [{ name: 'unknown', details: 'The property "x" is not expected', path: ['parameters', 'x'] }] },
      requestId: 'req-1',
      request: { headers: { Authorization: 'Bearer secret' } },
    });
    const text = describeError({ message });
    expect(text).toBe('422 Unprocessable Entity: The property "x" is not expected (parameters.x) [request-id: req-1]');
    expect(text).not.toContain('secret');
  });

  it('never prints [object Object] for an empty rejection', () => {
    expect(describeError({})).toBe('Unknown error, with no detail from Contentful');
    expect(describeError(undefined)).toBe('Unknown error, with no detail from Contentful');
  });
});
