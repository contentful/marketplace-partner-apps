import { transformAsset } from '../../utils/transformAsset';

describe('transformAsset', () => {
  const minimalAsset = {
    id: 'A2C1C4E5-BAEF-4533-BC14638E27D429AE',
    name: 'test-asset',
    type: 'IMAGE',
    fileSize: 1024,
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-01T00:00:00Z',
    extension: ['png'],
    textMetaproperties: [],
    width: 100,
    height: 100,
    isPublic: 1,
  };

  describe('asset id format (Bynder 8-4-4-16)', () => {
    test('preserves Bynder 8-4-4-16 id as-is (no conversion to standard UUID)', () => {
      const bynderId = 'A2C1C4E5-BAEF-4533-BC14638E27D429AE';
      const result = transformAsset({ ...minimalAsset, id: bynderId });
      expect(result.id).toBe(bynderId);
      expect(result.id).not.toContain('BC14-638E'); // would be wrong 8-4-4-4-12 split
    });

    test('prefers databaseId over id when both present (avoids storing Base64)', () => {
      const databaseId = 'A2C1C4E5-BAEF-4533-BC14638E27D429AE';
      const base64LikeId = 'KEFzc2V0X2lkIEEyQzFDNEU1LUJBRUYtNDUzMy1CQzE0NjM4RTI3RDQyOUFFKQ==';
      const result = transformAsset({
        ...minimalAsset,
        id: base64LikeId,
        databaseId,
      });
      expect(result.id).toBe(databaseId);
    });

    test('uses id when databaseId is absent (e.g. API response)', () => {
      const apiId = '0ade272d-4480-49ed-a4b2-874a6eede2b7';
      const result = transformAsset({ ...minimalAsset, id: apiId });
      expect(result.id).toBe(apiId);
    });

    test('falls back to empty string when id and databaseId are missing', () => {
      const { id, ...noId } = minimalAsset;
      const result = transformAsset(noId as typeof minimalAsset);
      expect(result.id).toBe('');
    });

    test('preserves hyphen-less 32-char hex as-is', () => {
      const noHyphens = 'a2c1c4e5baef4533bc14638e27d429ae';
      const result = transformAsset({ ...minimalAsset, id: noHyphens });
      expect(result.id).toBe(noHyphens);
    });
  });

  describe('selectedFile', () => {
    test('uses selectedFile from options when provided', () => {
      const selected = { url: 'https://example.com/file.png' };
      const result = transformAsset(minimalAsset, { selectedFile: selected as any });
      expect(result.selectedFile).toEqual(selected);
    });

    test('preserves selectedFile from existingAsset when no option', () => {
      const existing = { selectedFile: { url: 'https://existing.com/file.png' } };
      const result = transformAsset(minimalAsset, { existingAsset: existing as any });
      expect(result.selectedFile).toEqual(existing.selectedFile);
    });
  });

  describe('filterFields and addSrc', () => {
    test('when filterFields true, only FIELDS_TO_PERSIST are returned', () => {
      const asset = { ...minimalAsset, files: { webImage: { url: 'https://thumb.png' } } };
      const result = transformAsset(asset as any, { filterFields: true, addSrc: true });
      expect(result.id).toBe(minimalAsset.id);
      expect(result.name).toBe(minimalAsset.name);
      expect(result.src).toBe('https://thumb.png');
      expect(Object.keys(result)).not.toContain('userCreated'); // not in FIELDS_TO_PERSIST
    });
  });

  describe('refresh: preserve existing thumbnails and URL metadata', () => {
    test('merges existing thumbnails with API thumbnails so Compact View variants are preserved', () => {
      const apiAsset = {
        ...minimalAsset,
        files: {
          webImage: { url: 'https://dam.example.com/m/abc/webimage-new.png' },
          thumbnail: { url: 'https://dam.example.com/m/abc/thul-new.png' },
        },
      };
      const existingAsset = {
        thumbnails: {
          webimage: 'https://dam.example.com/m/abc/webimage-old.png',
          thul: 'https://dam.example.com/m/abc/thul-old.png',
          mini: 'https://dam.example.com/m/abc/mini.png',
          original: 'https://dam.example.com/m/abc/original/file.tif',
          transformBaseUrl: 'https://dam.example.com/transform/uuid/file',
          inprv_card_large: 'https://dam.example.com/transform/inprv_card_large/uuid/file',
        },
      };
      const result = transformAsset(apiAsset as any, {
        existingAsset: existingAsset as any,
        filterFields: true,
        addSrc: true,
      });
      // API-provided webimage and thul override existing
      expect(result.thumbnails.webimage).toBe('https://dam.example.com/m/abc/webimage-new.png');
      expect(result.thumbnails.thul).toBe('https://dam.example.com/m/abc/thul-new.png');
      // Existing-only keys are preserved
      expect(result.thumbnails.mini).toBe('https://dam.example.com/m/abc/mini.png');
      expect(result.thumbnails.original).toBe('https://dam.example.com/m/abc/original/file.tif');
      expect(result.thumbnails.transformBaseUrl).toBe('https://dam.example.com/transform/uuid/file');
      expect(result.thumbnails.inprv_card_large).toBe('https://dam.example.com/transform/inprv_card_large/uuid/file');
    });

    test('preserves original from existing when API does not provide it', () => {
      const apiAsset = { ...minimalAsset };
      const existingAsset = { original: 'https://dam.example.com/original/file.tif' };
      const result = transformAsset(apiAsset as any, {
        existingAsset: existingAsset as any,
        filterFields: true,
      });
      expect(result.original).toBe('https://dam.example.com/original/file.tif');
    });

    test('uses API original when present, even with existing', () => {
      const apiAsset = { ...minimalAsset, originalUrl: 'https://api.example.com/original-new.tif' };
      const existingAsset = { original: 'https://dam.example.com/original-old.tif' };
      const result = transformAsset(apiAsset as any, { existingAsset: existingAsset as any });
      expect(result.original).toBe('https://api.example.com/original-new.tif');
    });
  });
});
