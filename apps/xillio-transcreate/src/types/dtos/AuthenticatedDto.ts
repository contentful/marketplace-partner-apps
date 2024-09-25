import { VersionDto } from './VersionDto';

export type AuthenticatedDto = VersionDto & {
  generatedToken: string;
};
