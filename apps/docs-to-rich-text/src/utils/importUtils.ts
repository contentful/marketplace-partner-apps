import { v4 as uuidv4 } from 'uuid';

export function isUrl(str: string): boolean {
  str = str.trim();
  if (str.includes(' ')) {
    return false;
  }

  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function getFileName(url: string): string {
  if (!url) {
    return uuidv4().replace(/-/g, '');
  }

  const fileName = url.split('/').pop() ?? '';
  return fileName?.split('.')[0] ?? '';
}

export function getFileNameWithExtension(url: string): string {
  if (!url) {
    return '';
  }

  return url.split('/').pop() ?? '';
}
