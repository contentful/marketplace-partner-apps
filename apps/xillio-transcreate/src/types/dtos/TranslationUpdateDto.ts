import { AuthenticatedDto } from './AuthenticatedDto';

export type TranslationUpdateDto = AuthenticatedDto & {
  dueDate: string;
  spaceId: string;
  environmentId: string;
  entries: {
    entryId: string;
    targetLanguage: string;
  }[];
};
