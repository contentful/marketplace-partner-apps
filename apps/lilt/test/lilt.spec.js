import { liltLocale } from '../src/lilt';

describe('liltLocale', () => {
  it('handles special locale cases', () => {
    const locale = liltLocale('zh-Hant');
    expect(locale).toBe('zt');
  });

  it('handles normal locale cases', () => {
    const locale = liltLocale('es-MX');
    expect(locale).toBe('es-MX');
  });
});
