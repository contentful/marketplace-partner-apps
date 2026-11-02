import { expect } from 'vitest';
import { rasterScope } from '../client';

describe('rasterScope', () => {
  it('keeps each Contentful user’s Raster sign-in apart', () => {
    expect(rasterScope({ space: 'space-1', user: 'user-1' }, undefined)).not.toBe(rasterScope({ space: 'space-1', user: 'user-2' }, undefined));
  });

  it('asks for a new sign-in when the organization is pinned', () => {
    expect(rasterScope({ space: 'space-1', user: 'user-1' }, 'acme')).toBe('raster.space-1.user-1.org.acme');
  });
});
