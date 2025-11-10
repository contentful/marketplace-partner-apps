import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockCma } from '../mocks';
import EntryCloner from '../../src/utils/EntryCloner';
import type { AppParameters } from '../../src/vite-env';
import { getMockContentType, getMockEntry } from './EntryClonerTestUtils';

vi.mock('@contentful/app-sdk', () => ({
  CMAClient: vi.fn().mockImplementation(() => mockCma),
}));

const setReferencesCount = vi.fn();
const setClonesCount = vi.fn();
const setUpdatesCount = vi.fn();

describe('EntryCloner', () => {
  let entryCloner: EntryCloner;
  let mockParameters: AppParameters;

  beforeEach(() => {
    vi.clearAllMocks();

    mockParameters = {
      cloneText: '[CLONE]',
      cloneTextBefore: true,
      automaticRedirect: true,
    };
    entryCloner = new EntryCloner(mockCma as any, mockParameters, 'main-entry-id', setReferencesCount, setClonesCount, setUpdatesCount);
  });

  describe('Clone entry with reference field', () => {
    let contentType: any;
    let referencedEntry: any;
    let mainEntry: any;
    let clonedReferencedEntry: any;
    let clonedMainEntry: any;
    let updatedMainEntry: any;

    beforeEach(() => {
      contentType = getMockContentType([
        { id: 'title', type: 'Text' },
        { id: 'reference', type: 'Link', linkType: 'Entry' },
      ]);

      referencedEntry = getMockEntry('referenced-entry-id', {
        title: { 'en-US': 'Referenced Entry Title' },
      });

      mainEntry = getMockEntry('main-entry-id', {
        title: { 'en-US': 'Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      clonedReferencedEntry = getMockEntry('cloned-referenced-entry-id', {
        title: { 'en-US': '[CLONE] Referenced Entry Title' },
      });

      clonedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      updatedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' },
          },
        },
      });
    });

    it('should clone an entry with one text field and a reference field', async () => {
      mockCma.contentType.get.mockResolvedValue(contentType);
      mockCma.entry.get.mockResolvedValueOnce(mainEntry).mockResolvedValueOnce(referencedEntry);
      mockCma.entry.create.mockResolvedValueOnce(clonedMainEntry).mockResolvedValueOnce(clonedReferencedEntry);
      mockCma.entry.update.mockResolvedValueOnce(updatedMainEntry);
      const result = await entryCloner.cloneEntry();
      expect(result).toEqual(updatedMainEntry);
      expect(setReferencesCount).toHaveBeenCalledWith(2);
      expect(setClonesCount).toHaveBeenCalledWith(2);
      expect(setUpdatesCount).toHaveBeenCalledWith(1);

      expect(mockCma.entry.get).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'main-entry-id' });
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'referenced-entry-id' });
      expect(mockCma.entry.create).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.update).toHaveBeenCalledTimes(1);

      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        1,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: {
              'en-US': {
                sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
              },
            },
          },
        }
      );
      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        2,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Referenced Entry Title' },
          },
        }
      );

      expect(mockCma.entry.update).toHaveBeenCalledWith(
        {
          entryId: 'cloned-main-entry-id',
        },
        expect.objectContaining({
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: {
              'en-US': {
                sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' },
              },
            },
          },
        })
      );
    });

    it('should retry if there is a version mismatch error', async () => {
      mockCma.contentType.get.mockResolvedValue(contentType);
      mockCma.entry.get.mockResolvedValueOnce(mainEntry).mockResolvedValueOnce(referencedEntry).mockResolvedValueOnce(clonedMainEntry);
      mockCma.entry.create.mockResolvedValueOnce(clonedMainEntry).mockResolvedValueOnce(clonedReferencedEntry);
      mockCma.entry.update.mockRejectedValueOnce({ code: 'VersionMismatch' }).mockResolvedValueOnce(updatedMainEntry);
      const result = await entryCloner.cloneEntry();
      expect(result).toEqual(updatedMainEntry);
      expect(setReferencesCount).toHaveBeenCalledWith(2);
      expect(setClonesCount).toHaveBeenCalledWith(2);
      expect(setUpdatesCount).toHaveBeenCalledWith(1);

      expect(mockCma.entry.get).toHaveBeenCalledTimes(3);
      expect(mockCma.entry.get).toHaveBeenNthCalledWith(1, { entryId: 'main-entry-id' });
      expect(mockCma.entry.get).toHaveBeenNthCalledWith(2, { entryId: 'referenced-entry-id' });
      expect(mockCma.entry.get).toHaveBeenNthCalledWith(3, { entryId: 'cloned-main-entry-id' });
      expect(mockCma.entry.create).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.update).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.update).toHaveBeenCalledWith(
        { entryId: 'cloned-main-entry-id' },
        expect.objectContaining({
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' } } },
          },
        })
      );

      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        1,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: {
              'en-US': {
                sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
              },
            },
          },
        }
      );
      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        2,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Referenced Entry Title' },
          },
        }
      );

      expect(mockCma.entry.update).toHaveBeenCalledWith(
        {
          entryId: 'cloned-main-entry-id',
        },
        expect.objectContaining({
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: {
              'en-US': {
                sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' },
              },
            },
          },
        })
      );
    });
  });

  describe('Clone entry with array of references', () => {
    it('should clone an entry with array of references to the same entry and create only one clone', async () => {
      const contentType = getMockContentType([
        { id: 'title', type: 'Text' },
        { id: 'references', type: 'Array', items: { type: 'Link', linkType: 'Entry' } },
      ]);

      const referencedEntry = getMockEntry('referenced-entry-id', {
        title: { 'en-US': 'Referenced Entry Title' },
      });

      const mainEntry = getMockEntry('main-entry-id', {
        title: { 'en-US': 'Main Entry Title' },
        references: {
          'en-US': [
            { sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' } },
            { sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' } },
          ],
        },
      });

      const clonedReferencedEntry = getMockEntry('cloned-referenced-entry-id', {
        title: { 'en-US': '[CLONE] Referenced Entry Title' },
      });

      const clonedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        references: {
          'en-US': [
            { sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' } },
            { sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' } },
          ],
        },
      });
      const updatedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        references: {
          'en-US': [
            { sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' } },
            { sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' } },
          ],
        },
      });

      mockCma.contentType.get.mockResolvedValue(contentType);
      mockCma.entry.get.mockResolvedValueOnce(mainEntry).mockResolvedValueOnce(referencedEntry);
      mockCma.entry.create.mockResolvedValueOnce(clonedMainEntry).mockResolvedValueOnce(clonedReferencedEntry);
      mockCma.entry.update.mockResolvedValueOnce(updatedMainEntry);

      const result = await entryCloner.cloneEntry();
      expect(result).toEqual(updatedMainEntry);
      expect(setReferencesCount).toHaveBeenCalledWith(2);
      expect(setClonesCount).toHaveBeenCalledWith(2);
      expect(setUpdatesCount).toHaveBeenCalledWith(1);

      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'main-entry-id' });
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'referenced-entry-id' });
      expect(mockCma.entry.create).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.update).toHaveBeenCalledTimes(1);
      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        1,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            references: {
              'en-US': [
                {
                  sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
                },
                {
                  sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
                },
              ],
            },
          },
        }
      );
      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        2,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Referenced Entry Title' },
          },
        }
      );
      expect(mockCma.entry.update).toHaveBeenCalledWith(
        { entryId: 'cloned-main-entry-id' },
        expect.objectContaining({
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            references: {
              'en-US': [
                { sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' } },
                { sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' } },
              ],
            },
          },
        })
      );
    });
  });

  describe('Handle deleted entries', () => {
    it('should not fail if an entry was deleted', async () => {
      const contentType = getMockContentType([
        { id: 'title', type: 'Text' },
        { id: 'reference', type: 'Link', linkType: 'Entry' },
      ]);

      const mainEntry = getMockEntry('main-entry-id', {
        title: { 'en-US': 'Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      const clonedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      const updatedMainEntry = getMockEntry('cloned-main-entry-id', {
        title: { 'en-US': '[CLONE] Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      mockCma.contentType.get.mockResolvedValue(contentType);
      mockCma.entry.get.mockResolvedValueOnce(mainEntry).mockRejectedValueOnce(new Error('Error'));
      mockCma.entry.create.mockResolvedValueOnce(clonedMainEntry);
      const result = await entryCloner.cloneEntry();
      expect(result).toEqual(updatedMainEntry);
      expect(setReferencesCount).toHaveBeenCalledWith(1);
      expect(setClonesCount).toHaveBeenCalledWith(1);
      expect(setUpdatesCount).not.toHaveBeenCalled();

      expect(mockCma.entry.get).toHaveBeenCalledTimes(2);
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'main-entry-id' });
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'referenced-entry-id' });
      expect(mockCma.entry.create).toHaveBeenCalledTimes(1);
      expect(mockCma.entry.update).not.toHaveBeenCalled();

      expect(mockCma.entry.create).toHaveBeenNthCalledWith(
        1,
        { contentTypeId: 'testContentType' },
        {
          fields: {
            title: { 'en-US': '[CLONE] Main Entry Title' },
            reference: {
              'en-US': {
                sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
              },
            },
          },
        }
      );
    });
  });
});
