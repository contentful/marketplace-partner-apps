import { AuthenticatedDto } from './AuthenticatedDto';

export type TranslationStatusDto = AuthenticatedDto & {
  spaceId: string;
  environmentId: string;
  entryIds: string[];
};
