import { AssetType } from '@contentful/f36-components';

export const mapMimeTypeToAssetType = (mimeType: string): AssetType => {
  const mapping = {
    // Archive types
    'application/zip': 'archive',
    'application/x-tar': 'archive',
    'application/x-rar-compressed': 'archive',
    'application/x-7z-compressed': 'archive',

    // Audio types
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'audio/aac': 'audio',
    'audio/ogg': 'audio',

    // Code types
    'text/css': 'code',
    'text/javascript': 'code',
    'application/javascript': 'code',
    'application/x-javascript': 'code',
    'application/json': 'code',

    // Image types
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/svg+xml': 'image',

    // Markup types
    'text/html': 'markup',
    'application/xml': 'markup',

    // PDF types
    'application/pdf': 'pdf',

    // Plaintext types
    'text/plain': 'plaintext',

    // Presentation types
    'application/vnd.ms-powerpoint': 'presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',

    // Richtext types
    'application/rtf': 'richtext',

    // Spreadsheet types
    'application/vnd.ms-excel': 'spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',

    // Video types
    'video/mp4': 'video',
    'video/avi': 'video',
    'video/webm': 'video',
    'video/quicktime': 'video',
  };

  return mapping[mimeType] ?? 'archive';
};
