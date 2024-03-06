import { describe, it, expect } from 'vitest';
import { getWixInstallUrl } from './wix-app.srv'; // Adjust the import path as necessary

describe('getWixInstallUrl', () => {
  it('should create a valid URL', () => {
    const connectionState = {
      contentfulAppId: 'app-id',
      environment: { id: 'env-id', label: 'Environment' },
      space: { id: 'space-id', label: 'Space' },
      locales: [{ id: 'locale-id', label: 'Locale', isDefault: true }],
    };

    const url = getWixInstallUrl(connectionState);
    const parsedUrl = new URL(url);

    expect(url).toBeTypeOf('string');
    expect(parsedUrl.hostname).toBe('manage.wix.com');
  });

  it('should set the actionUrl correctly', () => {
    const connectionState = {
      contentfulAppId: 'app-id',
      environment: { id: 'env-id', label: 'Environment' },
      space: { id: 'space-id', label: 'Space' },
      locales: [{ id: 'locale-id', label: 'Locale', isDefault: true }],
    };

    const url = getWixInstallUrl(connectionState);
    const parsedUrl = new URL(url);

    expect(parsedUrl.searchParams.get('actionUrl')).toContain(
      'https://www.wix.com/installer/install'
    );
  });

  it('should set correct query params in the action url', () => {
    const connectionState = {
      contentfulAppId: 'app-id',
      environment: { id: 'env-id', label: 'Environment' },
      space: { id: 'space-id', label: 'Space' },
      locales: [{ id: 'locale-id', label: 'Locale', isDefault: true }],
    };

    const url = getWixInstallUrl(connectionState);
    const parsedUrl = new URL(url);
    const actionUrl = new URL(parsedUrl.searchParams.get('actionUrl')!);

    expect(actionUrl.searchParams.get('metaSiteId')).toBe('{metaSiteId}');
    expect(actionUrl.searchParams.get('appId')).toBe(
      '9f6d5767-4aea-4de0-93bc-ae381c513365'
    );
    expect(actionUrl.searchParams.get('redirectUrl')).toBe(
      'https://www.contentful-on-wix.com/_functions/redirectToContentful'
    );
  });

  it('should include the correct state in the actionUrl', () => {
    const connectionState = {
      contentfulAppId: 'app-id',
      environment: { id: 'env-id', label: 'Environment' },
      space: { id: 'space-id', label: 'Space' },
      locales: [{ id: 'locale-id', label: 'Locale', isDefault: true }],
    };

    const url = getWixInstallUrl(connectionState);
    const parsedUrl = new URL(url);
    const actionUrl = new URL(parsedUrl.searchParams.get('actionUrl')!);

    const state = JSON.parse(actionUrl.searchParams.get('state')!);

    expect(state.connectionState).toEqual(connectionState);
    expect(state.mode).toBe('contentful-market-app');
  });
});
