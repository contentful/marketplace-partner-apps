import { describe, it, expect, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { appInstallationTestkit } from '../../test/testkit/appInstallationSrv.testkit';
import { ConnectedSitesList, TestIds } from './ConnectedSitesList';

describe('ConnectedSitesList', () => {
  const testkit = appInstallationTestkit();
  testkit.beforeAndAfter();
  beforeEach(cleanup);

  it('displays loading skeleton initially', async () => {
    testkit.given.noConnectedBusinesses();
    const component = render(
      <ConnectedSitesList
        environmentId="env1"
        spaceId="space1"
        contentfulAppId="app1"
        updatesModifier={0}
      />,
    );

    // Assert that the loading state is rendered
    await waitFor(() => {
      expect(
        component.getAllByTestId(TestIds.LOADING_SKELETON)[0],
      ).toBeInTheDocument();
    });
  });

  it('displays connected sites after loading for the given props', async () => {
    const siteDisplayName = 'Test Site 1';
    const siteDisplayName2 = 'Test Site 2';
    const environmentId = 'env1';
    const spaceId = 'space1';
    const contentfulAppId = 'app1';
    const props = {
      environmentId,
      spaceId,
      contentfulAppId,
      updatesModifier: 0,
    };
    testkit.given.connectedBusinesses([
      {
        siteId: '123',
        siteDisplayName,
        wixManageUrl: 'http://manage.wix.com/site-1',
        wixInstanceId: 'instance123',
      },
      {
        siteId: '124',
        siteDisplayName: siteDisplayName2,
        wixManageUrl: 'http://manage.wix.com/site-2',
        wixInstanceId: 'instance124',
      },
    ]);
    const component = render(<ConnectedSitesList {...props} />);

    // Wait for the async data fetching to complete
    await waitFor(() => {
      expect(component.getByText(siteDisplayName)).toBeInTheDocument();
      expect(component.getByText(siteDisplayName2)).toBeInTheDocument();
      expect(testkit.mocks.getConnectedBusinesses).toHaveBeenCalledWith({
        environmentId,
        spaceId,
        contentfulAppId,
      });
    });
  });

  it('presents a link to open the Wix dashboard', async () => {
    const wixManageUrl = 'http://manage.wix.com/site-1';
    let siteDisplayName = 'Site 1';
    testkit.given.connectedBusinesses([
      {
        siteId: '123',
        siteDisplayName,
        wixManageUrl: wixManageUrl,
        wixInstanceId: 'instance123',
      },
    ]);
    const component = render(
      <ConnectedSitesList
        environmentId="env1"
        spaceId="space1"
        contentfulAppId="app1"
        updatesModifier={0}
      />,
    );

    // Wait for the async data fetching to complete
    await waitFor(() => {
      expect(component.getByText(siteDisplayName)).toBeInTheDocument();
    });
    expect(
      component.getByTestId(TestIds.OPEN_WIX_DASHBOARD),
    ).toBeInTheDocument();
    expect(
      component.getByTestId(TestIds.OPEN_WIX_DASHBOARD).getAttribute('href'),
    ).toEqual(wixManageUrl);
  });

  it('presents a no sites connected message when there are no connected sites', async () => {
    testkit.given.noConnectedBusinesses();
    const component = render(
      <ConnectedSitesList
        environmentId="env1"
        spaceId="space1"
        contentfulAppId="app1"
        updatesModifier={0}
      />,
    );

    // Wait for the async data fetching to complete
    await waitFor(() => {
      expect(
        component.getByTestId(TestIds.NO_SITES_CONNECTED),
      ).toBeInTheDocument();
    });
  });

  it('handles remove connection action', async () => {
    const connectedBusiness = {
      siteId: '123',
      siteDisplayName: 'Mock Site',
      wixManageUrl: 'https://manage.wix.mock',
      wixInstanceId: 'abc123',
    };
    const componentProps = {
      environmentId: 'env1',
      spaceId: 'space1',
      contentfulAppId: 'app1',
      updatesModifier: 0,
    };
    testkit.given.connectedBusinesses([connectedBusiness]);

    const component = render(<ConnectedSitesList {...componentProps} />);

    // Wait for sites to be displayed
    await waitFor(() => {
      expect(
        component.getByTestId(TestIds.CONNECTED_SITE_WRAPPER),
      ).toBeInTheDocument();
    });
    testkit.mocks.getConnectedBusinesses.mockClear();

    fireEvent.click(component.getByTestId(TestIds.REMOVE_CONNECTION));

    expect(testkit.mocks.removeConnectedBusiness).toHaveBeenCalledWith({
      environmentId: componentProps.environmentId,
      spaceId: componentProps.spaceId,
      contentfulAppId: componentProps.contentfulAppId,
      wixInstanceId: connectedBusiness.wixInstanceId,
    });

    await waitFor(() => {
      expect(testkit.mocks.getConnectedBusinesses).toHaveBeenCalled();
    });
  });
});
