import { VersionDto } from './VersionDto';

export type ConfigDto = VersionDto & {
  appInstallationId: string;
  locHubUrl: string;
  locHubUsername: string;
  locHubPassword: string;
};
