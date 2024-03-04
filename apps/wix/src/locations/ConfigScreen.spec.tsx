import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import { appInstallationTestkit } from '../../test/testkit/appInstallationSrv.testkit';
import { Config, TestIds } from './ConfigScreen';
import { mockSdk } from '../../test/mocks';
import { getWixInstallUrl } from '../services/wix-app.srv';

// Mock the modules that are used in the component
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Config component', () => {
  const installationTestkit = appInstallationTestkit();
  const testContentfulAppId = 'testContentfulAppId';
  const testSpace = { name: 'Test Space', id: 'testSpaceId' };
  const testEnvironment = { name: 'Test Env', id: 'testEnvId' };
  const testLocales = [
    {
      code: 'en-US',
      name: 'English (United States)',
      default: true,
    },
  ];

  beforeEach(() => {
    installationTestkit.beforeEach();
    mockSdk.cma.space.get.mockResolvedValue(testSpace);
    mockSdk.cma.environment.get.mockResolvedValue(testEnvironment);
    mockSdk.cma.locale.getMany.mockResolvedValue({ items: testLocales });
    mockSdk.ids.app = testContentfulAppId;
    mockSdk.ids.space = testSpace.id;
    mockSdk.ids.environment = testEnvironment.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders the initial UI as expected', () => {
    const component = render(<Config />);
    expect(component.getByTestId(TestIds.TITLE)).toBeInTheDocument();
  });

  it('renders not connected state when the app is not installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(false);
    const component = render(<Config />);
    await waitFor(() => {
      expect(
        component.getByTestId(TestIds.NOT_INSTALLED_STATE),
      ).toBeInTheDocument();
    });
  });

  it('renders connect site section when app is installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);
    const component = render(<Config />);
    await waitFor(() => {
      expect(
        component.getByTestId(TestIds.CONNECT_ACCOUNT),
      ).toBeInTheDocument();
    });
  });

  describe('Connecting additional businesses', () => {
    const childWindow = {};
    let windowOpenMock: any;

    beforeEach(() => {
      windowOpenMock = vi
        .spyOn(window, 'open')
        .mockReturnValue(childWindow as any);
    });

    function triggerChildWindowEvent() {
      return act(() => {
        const fakeEvent = new MessageEvent('message', {
          source: childWindow as any,
          data: { connected: true },
          origin: 'http://example.com',
        });
        window.dispatchEvent(fakeEvent);
      });
    }

    it('should set up and clean up the message event listener', () => {
      const addEventListenerMock = vi.spyOn(window, 'addEventListener');
      const removeEventListenerMock = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<Config />);

      expect(addEventListenerMock).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );

      triggerChildWindowEvent();

      unmount();

      // Assert that the event listener was removed
      expect(removeEventListenerMock).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
    });

    it('should trigger window open even with the relevant url when clicking add connection button', async () => {
      mockSdk.app.isInstalled.mockResolvedValue(true);
      const component = render(<Config />);
      await waitFor(() => {
        expect(
          component.getByTestId(TestIds.CONNECT_ACCOUNT),
        ).toBeInTheDocument();
      });

      fireEvent.click(component.getByTestId(TestIds.CONNECT_ACCOUNT));

      const expectedUrl = getWixInstallUrl({
        contentfulAppId: testContentfulAppId,
        environment: { label: testEnvironment.name, id: testEnvironment.id },
        space: { label: testSpace.name, id: testSpace.id },
        locales: testLocales.map((locale) => ({
          id: locale.code,
          label: locale.name,
          isDefault: locale.default,
        })),
      });

      await waitFor(() => {
        expect(windowOpenMock).toHaveBeenCalledWith(expectedUrl, '_blank');
      });
    });

    it('should re-fetch site list when connection is complete', async () => {
      mockSdk.app.isInstalled.mockResolvedValue(true);
      const component = render(<Config />);
      await waitFor(() => {
        expect(
          component.getByTestId(TestIds.CONNECT_ACCOUNT),
        ).toBeInTheDocument();
      });

      installationTestkit.mocks.getConnectedBusinesses.mockClear();

      fireEvent.click(component.getByTestId(TestIds.CONNECT_ACCOUNT));

      triggerChildWindowEvent();

      await waitFor(() => {
        expect(
          installationTestkit.mocks.getConnectedBusinesses,
        ).toHaveBeenCalled();
      });
    });
  });
});
