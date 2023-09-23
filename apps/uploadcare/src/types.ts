import { UPLOAD_SOURCES } from './constants';

export type InstanceParameters = {
  maxFiles?: number;
  uploadSourcesString?: string;
  imgOnly: 'useGlobalAppSetting' | 'allowAnyFiles' | 'allowImagesOnly';
};

export type AppInstallationParameters = {
  apiKey: string;
  maxFiles: number;
  uploadSources: Record<(typeof UPLOAD_SOURCES)[number]['value'], boolean>;
  imgOnly: boolean;
  customCname: string;
};

export type Asset = {
  cdnUrl: string;
  originalFilename: string;
  uuid: string;
};
