export const TranslationStatuses = [
  'pending',
  'confirmed',
  'in-progress',
  'paused',
  'cancelled',
  'completed',
  'completed-with-warnings',
  'failed',
  'rejected',
] as const;

export type TranslationStatus = (typeof TranslationStatuses)[number];

export type TranslationDto = {
  entryId: string;
  sourceLanguage: string;
  tasks: {
    parentEntryId: string | null;
    targetLanguage: string;
    dueDate: string;
    requestedAt: string;
    scrapedAt: string | null;
    status: TranslationStatus;
  }[];
};
