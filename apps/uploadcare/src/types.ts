import { UPLOAD_SOURCES } from './constants';

export type AppInstallationParameters = {
  apiKey: string;
  maxFiles: number;
  uploadSources: Record<(typeof UPLOAD_SOURCES)[number]['value'], boolean>;
};

export type Asset = {
  cdnUrl: string;
  originalFilename: string;
  uuid: string;
};
