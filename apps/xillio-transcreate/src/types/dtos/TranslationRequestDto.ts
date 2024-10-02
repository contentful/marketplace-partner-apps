import { AuthenticatedDto } from './AuthenticatedDto';

export type TranslationRequestDto = AuthenticatedDto & {
  projectId: string;
  jobName: string;
  jobDescription: string;
  jobSubmitter: string;
  sourceLanguage: string;
  recursive: boolean;
  dueDate: string;
  spaceId: string;
  environmentId: string;
  entries: {
    entryId: string;
    targetLanguage: string;
  }[];
};
