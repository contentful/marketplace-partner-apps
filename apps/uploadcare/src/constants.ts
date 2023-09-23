import { AppInstallationParameters } from './types';

export const UPLOAD_SOURCES = [
  {
    value: 'local',
    title: 'Local file',
  },
  {
    value: 'url',
    title: 'From URL',
  },
  {
    value: 'camera',
    title: 'Camera',
  },
  {
    value: 'box',
    title: 'Box',
  },
  {
    value: 'dropbox',
    title: 'Dropbox',
  },
  {
    value: 'evernote',
    title: 'Evernote',
  },
  {
    value: 'facebook',
    title: 'Facebook',
  },
  {
    value: 'flickr',
    title: 'Flickr',
  },
  {
    value: 'gdrive',
    title: 'Google Drive',
  },
  {
    value: 'gphotos',
    title: 'Google Photos',
  },
  {
    value: 'huddle',
    title: 'Huddle',
  },
  {
    value: 'instagram',
    title: 'Instagram',
  },
  {
    value: 'onedrive',
    title: 'OneDrive',
  },
  {
    value: 'vk',
    title: 'VK',
  },
] as const;

export const DEFAULT_UPLOAD_SOURCES_VALUES = ['local', 'url', 'camera', 'dropbox', 'gdrive'];

export const DEFAULT_PARAMETERS: AppInstallationParameters = {
  apiKey: '',
  maxFiles: 0,
  imgOnly: false,
  uploadSources: UPLOAD_SOURCES.reduce(
    (acc, { value }) => {
      acc[value] = DEFAULT_UPLOAD_SOURCES_VALUES.includes(value);
      return acc;
    },
    {} as AppInstallationParameters['uploadSources'],
  ),
  customCname: '',
} as const;
