import { AppInstallationParameters } from './types';

export const DEFAULT_APP_INSTALLATION_PARAMETERS: AppInstallationParameters = {
  cloudName: '',
  apiKey: '',
  maxFiles: 10,
  startFolder: '',
  quality: 'auto',
  format: 'auto',
};
export const VALID_IMAGE_FORMATS = ['svg', 'jpg', 'png', 'gif', 'jpeg', 'tiff', 'ico', 'webp', 'pdf', 'bmp', 'psd', 'eps', 'jxr', 'wdp'];
