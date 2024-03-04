import { vi, beforeEach, afterEach } from 'vitest';

const connectedBusinessesRes = {
  connectedBusinesses: [] as Array<ConnectedSite>,
};
const deleteBusinessRes = { success: true };

const mocks = {
  getConnectedBusinesses: vi.fn(),
  removeConnectedBusiness: vi.fn(),
};

const getConnectedBusinessesMock = async (...args: any[]) => {
  // vi.fn() returns a function that cannot be async
  mocks.getConnectedBusinesses(...args);
  return connectedBusinessesRes;
};

const removeConnectedBusinessMock = async (...args: any[]) => {
  // vi.fn() returns a function that cannot be async
  mocks.removeConnectedBusiness(...args);
  return deleteBusinessRes;
};

vi.mock('../../src/services/app-installation.srv', () => ({
  getConnectedBusinesses: getConnectedBusinessesMock,
  removeConnectedBusiness: removeConnectedBusinessMock,
}));

import { ConnectedSite } from '../../src/services/app-installation.srv';

export const appInstallationTestkit = () => {
  const connectedBusinesses = (
    connectedBusinesses: Array<ConnectedSite> = [
      {
        siteId: '123',
        siteDisplayName: 'Mock Site',
        wixManageUrl: 'https://manage.wix.mock',
        wixInstanceId: 'abc123',
      },
    ]
  ) => {
    connectedBusinessesRes.connectedBusinesses = connectedBusinesses;
  };
  const noConnectedBusinesses = () => {
    connectedBusinessesRes.connectedBusinesses = [];
  };

  const deleteBusinessStatus = (status: boolean) => {
    deleteBusinessRes.success = status;
  };

  const _beforeEach = () => {
    // Reset mocks' states here if necessary, for example:
    vi.resetAllMocks();
    connectedBusinesses();
    deleteBusinessStatus(true);
  };
  const _afterEach = () => {
    // Restore mocks to their original state
    vi.restoreAllMocks();
  };

  return {
    given: {
      connectedBusinesses,
      noConnectedBusinesses,
      deleteBusinessStatus,
    },
    mocks,
    beforeEach: _beforeEach,
    afterEach: _afterEach,
    beforeAndAfter: () => {
      beforeEach(_beforeEach);

      afterEach(_afterEach);
    },
  };
};
