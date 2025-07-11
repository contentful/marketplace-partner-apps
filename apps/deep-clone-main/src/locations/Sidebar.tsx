import { useState } from 'react';
import { Stack, Button, Caption } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { AppParameters, Reference } from '../vite-env';
import { Entry } from 'contentful-management';

interface InstallationParams extends AppParameters {
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

function Sidebar() {
  const sdk = useSDK() as SidebarAppSDK;

  const installationParams: InstallationParams = {
    cloneText: 'Copy',
    cloneTextBefore: true,
    cloneAssets: false,
    automaticRedirect: true,
    msToRedirect: 5000,
    ...sdk.parameters.installation,
  };

  if (typeof installationParams.msToRedirect === 'string') {
    installationParams.msToRedirect = parseInt(installationParams.msToRedirect, 10);
  }

  const references: Reference = {};
  const [referenceCount, setReferenceCount] = useState<number>(0);
  const [newReferenceCount, setNewReferenceCount] = useState<number>(0);
  const [updatedReferenceCount, setUpdatedReferenceCount] = useState<number>(0);

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);

  // Initiate the clone process, show/hide loading, disable/enable button
  const clone = async (): Promise<void> => {
    setLoading(true);
    setDisabled(true);
    const clonedEntry = await cloneEntry(sdk.ids.entry);

    setLoading(false);

    if (installationParams.automaticRedirect === true) {
      setTimeout(() => {
        sdk.navigator.openEntry(clonedEntry.sys.id);
        setDisabled(false);
      }, installationParams.msToRedirect);
    } else {
      setDisabled(false);
    }
  };

  // Find references in the current entry, and update the references for the entire reference tree
  const cloneEntry = async (entryId: string): Promise<Entry> => {
    try {
      await findReferences(sdk.ids.entry);
      const newReferences = await createNewEntriesFromReferences();
      await updateReferenceTree(newReferences);
      return newReferences[entryId];
    } catch (error) {
      throw new Error(`Failed to clone entry: ${(error as Error).message}`);
    }
  };

  const createNewEntriesFromReferences = async (): Promise<NewEntries> => {
    const newEntries: NewEntries = {};

    for (const entryId in references) {
      const entry = references[entryId];

      if (!entry) continue;

      // Create a deep copy of the entry fields to avoid modifying the original
      const entryFields = JSON.parse(JSON.stringify(entry.fields));

      // Get the content type to find the title field
      const contentType = (await sdk.cma.contentType.get({
        contentTypeId: entry.sys.contentType.sys.id,
      })) as ContentType;

      // Find the field that is marked as the title field
      const titleField = contentType.fields.find((field) => field.id === contentType.displayField);

      if (titleField && entryFields[titleField.id]) {
        for (const locale in entryFields[titleField.id]) {
          if (entryFields[titleField.id][locale]) {
            const title = entryFields[titleField.id][locale];
            entryFields[titleField.id][locale] = installationParams.cloneTextBefore
              ? `${installationParams.cloneText} ${title}`
              : `${title} ${installationParams.cloneText}`;
          }
        }
      }

      const newEntry = await sdk.cma.entry.create({ contentTypeId: entry.sys.contentType.sys.id }, { fields: entryFields });

      setNewReferenceCount((prev) => prev + 1);
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

  const updateReferenceTree = async (newReferences: NewEntries): Promise<void> => {
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
        const latestEntry = await sdk.cma.entry.get({ entryId: entry.sys.id });

        // Update with the latest version number
        await sdk.cma.entry.update(
          { entryId: entry.sys.id },
          {
            sys: { ...entry.sys, version: latestEntry.sys.version },
            fields: entry.fields,
          }
        );

        setUpdatedReferenceCount((prev) => prev + 1);
      } catch (error: any) {
        if (error.status === 409) {
          // If we get a version conflict, try one more time with the latest version
          const latestEntry = await sdk.cma.entry.get({ entryId: entry.sys.id });
          await sdk.cma.entry.update(
            { entryId: entry.sys.id },
            {
              sys: { ...entry.sys, version: latestEntry.sys.version },
              fields: entry.fields,
            }
          );
          setUpdatedReferenceCount((prev) => prev + 1);
        } else {
          throw error;
        }
      }
    }
  };

  const inspectField = async (field: FieldValue | FieldValue[]): Promise<void> => {
    if (field && Array.isArray(field)) {
      await Promise.all(
        field.map(async (f) => {
          return await inspectField(f);
        })
      );
      return;
    }

    if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Entry') {
      await findReferences(field.sys.id, 'entry');
    }

    // Not needed, as we don't go further on assets
    if (installationParams.cloneAssets === true) {
      if (field && field.sys && field.sys.type === 'Link' && field.sys.linkType === 'Asset') {
        // Not part of POC
      }
    }
  };

  const findReferences = async (entryId: string, type: string = 'entry'): Promise<void> => {
    // Entry already in the references, nothing to do
    if (references[entryId]) {
      return;
    }

    // Check if it is an asset or not
    let entry: any = undefined;

    if (installationParams.cloneAssets === true && type === 'asset') {
      try {
        entry = await sdk.cma.asset.get({ assetId: entryId });
      } catch (_error) {
        return;
      }
    } else {
      try {
        entry = await sdk.cma.entry.get({ entryId: entryId });
      } catch (_error) {
        return;
      }
    }

    setReferenceCount((prev) => prev + 1);
    if (entry !== undefined) {
      references[entryId] = entry;

      for (const fieldName in entry.fields) {
        const field = entry.fields[fieldName];

        for (const lang in field) {
          const langField = field[lang];
          await inspectField(langField);
        }
      }
    }
  };

  return (
    <Stack alignItems="start" flexDirection="column" spacing="spacingS">
      <Button variant="primary" isLoading={isLoading} isDisabled={isDisabled} onClick={clone}>
        Clone
      </Button>
      <Caption id="caption">
        {isLoading
          ? `Cloning: Found ${referenceCount} references, created ${newReferenceCount} new entries, updated ${updatedReferenceCount} references`
          : isDisabled && installationParams.automaticRedirect
          ? `Redirecting to newly created clone in ${Math.round(installationParams.msToRedirect / 1000)} seconds.`
          : 'This clones the entry and all referenced entries'}
      </Caption>
    </Stack>
  );
}

export default Sidebar;
