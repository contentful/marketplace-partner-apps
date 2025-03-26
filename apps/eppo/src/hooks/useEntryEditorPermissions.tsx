import { EditorAppSDK } from '@contentful/app-sdk';
import { useEditorPermissions } from '../components/modified/useEditorPermissions';
import { useMemo } from 'react';

export const useEntryEditorPermissions = (
  sdk: EditorAppSDK,
  allowedContentTypes: Array<string>,
) => {
  const contentTypes = useMemo(() => {
    return sdk.space.getCachedContentTypes();
  }, [sdk.space]);

  return useEditorPermissions({
    access: sdk.access,
    entityType: 'Entry',
    parameters: {
      instance: {
        showCreateEntityAction: true,
        showLinkEntityAction: true,
        bulkEditing: false,
      },
    },
    allContentTypes: contentTypes,
    validations: {
      contentTypes: allowedContentTypes,
    },
  });
};
