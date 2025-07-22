import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockCma } from './mocks';
import EntryCloner from '../src/utils/EntryCloner';
import type { AppParameters } from '../src/vite-env';
import { getMockContentType, getMockEntry } from './EntryClonerTestUtils';

vi.mock('@contentful/app-sdk', () => ({
  CMAClient: vi.fn().mockImplementation(() => mockCma),
}));

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

    entryCloner = new EntryCloner(mockCma as any, mockParameters);
  });

  describe('Clone entry with reference field', () => {
    it('should clone an entry with one text field and a reference field', async () => {
      const contentType = getMockContentType([
        { id: 'title', type: 'Text' },
        { id: 'reference', type: 'Link', linkType: 'Entry' },
      ]);

      const referencedEntry = getMockEntry('referenced-entry-id', {
        title: { 'en-US': 'Referenced Entry Title' },
      });

      const mainEntry = getMockEntry('main-entry-id', {
        title: { 'en-US': 'Main Entry Title' },
        reference: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Entry', id: 'referenced-entry-id' },
          },
        },
      });

      const clonedReferencedEntry = getMockEntry('cloned-referenced-entry-id', {
        title: { 'en-US': '[CLONE] Referenced Entry Title' },
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
            sys: { type: 'Link', linkType: 'Entry', id: 'cloned-referenced-entry-id' },
          },
        },
      });

      mockCma.contentType.get.mockResolvedValue(contentType);
      mockCma.entry.get.mockResolvedValueOnce(mainEntry).mockResolvedValueOnce(referencedEntry);
      mockCma.entry.create.mockResolvedValueOnce(clonedMainEntry).mockResolvedValueOnce(clonedReferencedEntry);
      const result = await entryCloner.cloneEntry('main-entry-id');
      expect(result).toEqual({
        clonedEntry: updatedMainEntry,
        referencesCount: 2,
        clonesCount: 2,
        updatesCount: 1,
      });

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

      const result = await entryCloner.cloneEntry('main-entry-id');
      expect(result).toEqual({
        clonedEntry: updatedMainEntry,
        referencesCount: 2,
        clonesCount: 2,
        updatesCount: 1,
      });

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
});
