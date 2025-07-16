import { Entry } from 'contentful-management';
import { CMAClient } from '@contentful/app-sdk';
import { AppParameters } from '@/vite-env';

// Type definitions for references used in the cloning process
export interface Reference {
  [entryId: string]: {
    sys: {
      id: string;
      type: string;
      version: number;
      contentType: {
        sys: {
          id: string;
          type: string;
          linkType: string;
        };
      };
    };
    fields: {
      [fieldName: string]: {
        [locale: string]: any;
      };
    };
  };
}

export interface InstallationParams extends AppParameters {
  msToRedirect: number;
}

interface NewEntries {
  [entryId: string]: any;
}

interface ContentTypeField {
  id: string;
  type: string;
}

interface ContentType {
  sys: {
    id: string;
    type: string;
  };
  fields: ContentTypeField[];
  displayField?: string;
}

interface FieldValue {
  sys?: {
    id: string;
    type: string;
    linkType?: string;
  };
  [key: string]: any;
}

const references: Reference = {};

// Find references in the current entry, and update the references for the entire reference tree
export const cloneEntry = async (entryId: string, installationParams: InstallationParams, cma: CMAClient): Promise<Entry> => {
  try {
    await findReferences(entryId, cma, installationParams.cloneAssets);
    const newReferences = await createNewEntriesFromReferences(installationParams.cloneText, installationParams.cloneTextBefore, cma);
    await updateReferenceTree(newReferences, cma);
    return newReferences[entryId];
  } catch (error) {
    throw new Error(`Failed to clone entry: ${(error as Error).message}`);
  }
};

const createNewEntriesFromReferences = async (cloneText: string, cloneTextBefore: boolean, cma: CMAClient): Promise<NewEntries> => {
  const newEntries: NewEntries = {};

  for (const entryId in references) {
    const entry = references[entryId];

    if (!entry) continue;

    // Create a deep copy of the entry fields to avoid modifying the original
    const entryFields = JSON.parse(JSON.stringify(entry.fields));

    // Get the content type to find the title field
    const contentType = (await cma.contentType.get({
      contentTypeId: entry.sys.contentType.sys.id,
    })) as ContentType;

    // Find the field that is marked as the title field
    const titleField = contentType.fields.find((field) => field.id === contentType.displayField);

    if (titleField && entryFields[titleField.id]) {
      for (const locale in entryFields[titleField.id]) {
        if (entryFields[titleField.id][locale]) {
          const title = entryFields[titleField.id][locale];
          entryFields[titleField.id][locale] = cloneTextBefore ? `${cloneText} ${title}` : `${title} ${cloneText}`;
        }
      }
    }

    const newEntry = await cma.entry.create({ contentTypeId: entry.sys.contentType.sys.id }, { fields: entryFields });

    // TODO: setNewReferenceCount((prev) => prev + 1);
    newEntries[entryId] = newEntry;
  }

  return newEntries;
};

const updateReferencesOnField = async (field: FieldValue | FieldValue[], newReferences: NewEntries): Promise<void> => {
  if (field && Array.isArray(field)) {
    await Promise.all(
      field.map(async (f) => {
        return await updateReferencesOnField(f, newReferences);
      })
    );
    return;
  }

  if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Entry') {
    const newReference = newReferences[field.sys.id];
    if (newReference !== undefined) {
      field.sys.id = newReference.sys.id;
    }
  }

  if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Asset') {
    // Handle asset references if needed
  }
};

const updateReferenceTree = async (newReferences: NewEntries, cma: CMAClient): Promise<void> => {
  for (const entryId in newReferences) {
    const entry = newReferences[entryId];

    for (const fieldName in entry.fields) {
      const field = entry.fields[fieldName];

      for (const lang in field) {
        const langField = field[lang];
        await updateReferencesOnField(langField, newReferences);
      }
    }

    try {
      // Get the latest version of the entry before updating
      const latestEntry = await cma.entry.get({ entryId: entry.sys.id });

      // Update with the latest version number
      await cma.entry.update(
        { entryId: entry.sys.id },
        {
          sys: { ...entry.sys, version: latestEntry.sys.version },
          fields: entry.fields,
        }
      );

      // TODO: setUpdatedReferenceCount((prev) => prev + 1);
    } catch (error: any) {
      if (error.status === 409) {
        // If we get a version conflict, try one more time with the latest version
        const latestEntry = await cma.entry.get({ entryId: entry.sys.id });
        await cma.entry.update(
          { entryId: entry.sys.id },
          {
            sys: { ...entry.sys, version: latestEntry.sys.version },
            fields: entry.fields,
          }
        );
        // TODO: setUpdatedReferenceCount((prev) => prev + 1);
      } else {
        throw error;
      }
    }
  }
};

const inspectField = async (field: FieldValue | FieldValue[], cma: CMAClient, cloneAssets: boolean): Promise<void> => {
  if (field && Array.isArray(field)) {
    await Promise.all(
      field.map(async (f) => {
        return await inspectField(f, cma, cloneAssets);
      })
    );
    return;
  }

  if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Entry') {
    await findReferences(field.sys.id, cma, cloneAssets, 'entry');
  }

  // Not needed, as we don't go further on assets
  if (cloneAssets === true) {
    if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Asset') {
      // Not part of POC
    }
  }
};

const findReferences = async (entryId: string, cma: CMAClient, cloneAssets: boolean, type: string = 'entry'): Promise<void> => {
  // Entry already in the references, nothing to do
  if (references[entryId]) {
    return;
  }

  // Check if it is an asset or not
  let entry: any = undefined;

  if (cloneAssets === true && type === 'asset') {
    try {
      entry = await cma.asset.get({ assetId: entryId });
    } catch (_error) {
      return;
    }
  } else {
    try {
      entry = await cma.entry.get({ entryId: entryId });
    } catch (_error) {
      return;
    }
  }

  // TODO: setReferenceCount((prev) => prev + 1);
  if (entry !== undefined) {
    references[entryId] = entry;

    for (const fieldName in entry.fields) {
      const field = entry.fields[fieldName];

      for (const lang in field) {
        const langField = field[lang];
        await inspectField(langField, cma, cloneAssets);
      }
    }
  }
};
