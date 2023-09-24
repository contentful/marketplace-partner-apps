import { UPLOAD_SOURCES } from './constants';

export type InstanceParams = {
  maxFiles?: number;
  uploadSourcesString?: string;
  imgOnly: 'useGlobalAppSetting' | 'allowAnyFiles' | 'allowImagesOnly';
};

export type InstanceParamsValidationErrors = Record<keyof InstanceParams, string>;

export type InstallParams = {
  apiKey: string;
  maxFiles: number;
  uploadSources: Record<(typeof UPLOAD_SOURCES)[number]['value'], boolean>;
  imgOnly: boolean;
  customCname: string;
};

export type InstallParamsValidationErrors = Record<keyof InstallParams, string>;

export type Asset = {
  cdnUrl: string;
  originalFilename: string;
  uuid: string;
};
