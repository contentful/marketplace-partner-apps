import React, { useState } from "react";
import { Stack, Button, Caption } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";

const Sidebar = () => {
  const sdk = useSDK();

  // Get installation parameters with defaults
  const installationParams = sdk.parameters.installation || {
    cloneText: "Copy",
    cloneTextBefore: true,
    cloneAssets: false,
    automaticRedirect: true,
    msToRedirect: 5000
  };

  // Convert msToRedirect to number if it's a string
  if (typeof installationParams.msToRedirect === 'string') {
    installationParams.msToRedirect = parseInt(installationParams.msToRedirect, 10);
  }

  var references = {};
  const [referenceCount, setReferenceCount] = useState(0);
  const [newReferenceCount, setNewReferenceCount] = useState(0);
  const [updatedReferenceCount, setUpdatedReferenceCount] = useState(0);

  const [isLoading, setLoading] = useState(false);
  const [isDisabled, setDisabled] = useState(false);

  //initiate the clone process, show/hide loading, disable/enable button
  let clone = async () => {
    setLoading(true);
    setDisabled(true);
    const clonedEntry = await cloneEntry(sdk.ids.entry);

    setLoading(false);

    if (installationParams.automaticRedirect === true) {
      await setTimeout(function () {
        sdk.navigator.openEntry(clonedEntry.sys.id);
        setDisabled(false);
      }, installationParams.msToRedirect);
    } else {
      setDisabled(false);
    }
  };

  //find references in the current entry, and update the references for the entire reference tree
  let cloneEntry = async (entryId) => {
    try {
      await findReferences(sdk.ids.entry);
      const newReferences = await createNewEntriesFromReferences();
      await updateReferenceTree(newReferences);
      return newReferences[entryId];
    } catch (error) {
      throw new Error(`Failed to clone entry: ${error.message}`);
    }
  };

  let createNewEntriesFromReferences = async (tag) => {
    const newEntries = {};

    for (let entryId in references) {
      const entry = references[entryId];
      
      // Create a deep copy of the entry fields to avoid modifying the original
      const entryFields = JSON.parse(JSON.stringify(entry.fields));

      // Get the content type to find the title field
      const contentType = await sdk.cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });

      // Find the field that is marked as the title field
      const titleField = contentType.fields.find(field => field.id === contentType.displayField);

      if (titleField && entryFields[titleField.id]) {
        for (let locale in entryFields[titleField.id]) {
          if (entryFields[titleField.id][locale]) {
            const title = entryFields[titleField.id][locale];
            entryFields[titleField.id][locale] = installationParams.cloneTextBefore
              ? `${installationParams.cloneText} ${title}`
              : `${title} ${installationParams.cloneText}`;
          }
        }
      }

      let newEntry = "";
      
      if(entry !== undefined) { 
        newEntry = await sdk.cma.entry.create(
          { contentTypeId: entry.sys.contentType.sys.id },
          { fields: entryFields },
        );

        setNewReferenceCount(prev => prev + 1);
        newEntries[entryId] = newEntry;
      }
    }

    return newEntries;
  };

  let updateReferencesOnField = async (field, newReferences) => {
    
    if (field && Array.isArray(field)) {
      return await Promise.all(
        field.map(async (f) => {
          return await updateReferencesOnField(f, newReferences);
        }),
      );
    }

    if (
      field &&
      field.sys &&
      field.sys.type === "Link" &&
      field.sys.linkType === "Entry"
    ) {
      const newReference = newReferences[field.sys.id];
      if(newReference !== undefined) field.sys.id = newReference.sys.id;
    }

    if (
      field &&
      field.sys &&
      field.sys.type === "Link" &&
      field.sys.linkType === "Asset"
    ) {

    }
  };

  let updateReferenceTree = async (newReferences) => {
    for (let entryId in newReferences) {
      const entry = newReferences[entryId];

      for (let fieldName in entry.fields) {
        const field = entry.fields[fieldName];

        for (let lang in field) {
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
            fields: entry.fields
          }
        );

        setUpdatedReferenceCount(prev => prev + 1);
      } catch (error) {
        if (error.status === 409) {
          // If we get a version conflict, try one more time with the latest version
          const latestEntry = await sdk.cma.entry.get({ entryId: entry.sys.id });
          await sdk.cma.entry.update(
            { entryId: entry.sys.id },
            {
              sys: { ...entry.sys, version: latestEntry.sys.version },
              fields: entry.fields
            }
          );
          setUpdatedReferenceCount(prev => prev + 1);
        } else {
          throw error;
        }
      }
    }
  };

  let inspectField = async (field) => {
    if (field && Array.isArray(field)) {
      return await Promise.all(
        field.map(async (f) => {
          return await inspectField(f);
        }),
      );
    }

    if (
      field &&
      field.sys &&
      field.sys.type === "Link" &&
      field.sys.linkType === "Entry"
    ) {
      await findReferences(field.sys.id, "entry");
    }
    //// not needed, as we don't go further on assets
    if (installationParams.cloneAssets === true) {
      if (
        field &&
        field.sys &&
        field.sys.type === "Link" &&
        field.sys.linkType === "Asset"
      ) {
        //not part of POC
      }
    }
  };

  let findReferences = async (entryId, type = "entry") => {
    //entry already in the references, nothing to do
    if (references[entryId]) {
      return;
    }
    //check if it is an asset or not
    let entry = undefined;
    
    if (installationParams.cloneAssets === true && type === 'asset') {
      try {
        entry = await sdk.cma.asset.get({assetId: entryId});
      } catch (error) {
        return;
      }
    } else {
      try {
        entry = await sdk.cma.entry.get({ entryId: entryId });
      } catch (error) {
        return;
      }
    }
    
    setReferenceCount(prev => prev + 1);
    if(entry !== undefined) {
      references[entryId] = entry;

      for (let fieldName in entry.fields) {
        const field = entry.fields[fieldName];
  
        for (let lang in field) {
          const langField = field[lang];
  
          await inspectField(langField);
        }
      }
    }
  };

  return (
    <Stack alignItems="start" flexDirection="column" spacing="spacingS">
      <Button
        variant="primary"
        isLoading={isLoading}
        isDisabled={isDisabled}
        onClick={clone}
      >
        Clone
      </Button>
      <Caption id="caption">
        {isLoading 
          ? `Cloning: Found ${referenceCount} references, created ${newReferenceCount} new entries, updated ${updatedReferenceCount} references`
          : isDisabled && installationParams.automaticRedirect
            ? `Redirecting to newly created clone in ${Math.round(installationParams.msToRedirect / 1000, 2)} seconds.`
            : "This clones the entry and all referenced entries"}
      </Caption>
    </Stack>
  );
};

export default Sidebar;
