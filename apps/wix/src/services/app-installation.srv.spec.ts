import { describe, it, expect, vi, Mock } from 'vitest';
import {
  getConnectedBusinesses,
  removeConnectedBusiness,
} from './app-installation.srv';

// Mocking the global fetch
global.fetch = vi.fn();

describe('app-installation service', () => {
  describe('getConnectedBusinesses', () => {
    it('getConnectedBusinesses: should return connected businesses', async () => {
      // Mock fetch response
      (fetch as Mock).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            connectedBusinesses: [
              {
                siteId: '123',
                siteDisplayName: 'Test Site',
                wixManageUrl: 'https://manage.wix.com',
                wixInstanceId: 'abc',
              },
            ],
          }),
      });

      const businessInfo = {
        environmentId: 'env-1',
        spaceId: 'space-1',
        contentfulAppId: 'app-1',
      };
      const result = await getConnectedBusinesses(businessInfo);

      expect(result).toEqual({
        connectedBusinesses: [
          {
            siteId: '123',
            siteDisplayName: 'Test Site',
            wixManageUrl: 'https://manage.wix.com',
            wixInstanceId: 'abc',
          },
        ],
      });
      expect(fetch).toHaveBeenCalledWith(
        `https://www.contentful-on-wix.com/_functions/appInstallationParams?environmentId=${businessInfo.environmentId}&spaceId=${businessInfo.spaceId}&appId=${businessInfo.contentfulAppId}`
      );
    });
  });

  describe('removeConnectedBusiness', () => {
    it('should indicate success on removing a business', async () => {
      // Mock fetch to resolve for DELETE request
      (fetch as Mock).mockResolvedValueOnce({ ok: true });

      const businessToRemove = {
        wixInstanceId: 'abc',
        environmentId: 'env-1',
        spaceId: 'space-1',
        contentfulAppId: 'app-1',
      };
      const result = await removeConnectedBusiness(businessToRemove);

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledWith(
        `https://www.contentful-on-wix.com/_functions/removeConnection?environmentId=${businessToRemove.environmentId}&spaceId=${businessToRemove.spaceId}&appId=${businessToRemove.contentfulAppId}&wixInstanceId=${businessToRemove.wixInstanceId}`,
        { method: 'DELETE' }
      );
    });

    it('should handle failure when removing a business', async () => {
      // uncomment if you need to debug, this hides the console.error
      console.error = vi.fn();
      (fetch as Mock).mockRejectedValueOnce(
        new Error('Failed to remove connection')
      );

      const result = await removeConnectedBusiness({
        wixInstanceId: 'abc',
        environmentId: 'env-1',
        spaceId: 'space-1',
        contentfulAppId: 'app-1',
      });

      expect(result).toEqual({ success: false });
    });
  });
});
