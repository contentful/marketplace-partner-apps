import { AuthenticatedDto } from './AuthenticatedDto';

export type TranslationTransitionDto = AuthenticatedDto & {
  spaceId: string;
  environmentId: string;
  entries: {
    entryId: string;
    targetLanguage: string;
  }[];
};
