import { useEffect, useState } from 'react';

import { useAccessApi } from '../components/field-editor-reference/common/useAccessApi';
import { AccessAPI, ContentEntityType, ContentType } from '@contentful/app-sdk';
import { useContentTypePermissions } from './useContentTypePermissions';

export type EditorPermissionsProps = {
  access: AccessAPI;
  entityType: ContentEntityType;
  parameters: {
    instance: {
      showCreateEntityAction?: boolean;
      showLinkEntityAction?: boolean;
      bulkEditing?: boolean;
    };
  };
  allContentTypes: ContentType[];
};

export function useEditorPermissions(props: EditorPermissionsProps) {
  const { access, entityType, parameters } = props;
  const [canCreateEntity, setCanCreateEntity] = useState(true);
  const [canLinkEntity, setCanLinkEntity] = useState(true);
  const validations = {};
  const { creatableContentTypes, availableContentTypes } = useContentTypePermissions({
    ...props,
    validations,
  });
  const { canPerformAction } = useAccessApi(access);

  useEffect(() => {
    if (parameters.instance.showCreateEntityAction === false) {
      setCanCreateEntity(false);
      return;
    }

    async function checkCreateAccess() {
      if (entityType === 'Asset') {
        // Hardcoded `true` value following https://contentful.atlassian.net/browse/DANTE-486
        // TODO: refine permissions check in order to account for tags in rules
        const canCreate = (await canPerformAction('create', 'Asset')) || true;
        setCanCreateEntity(canCreate);
      }
      if (entityType === 'Entry') {
        // Hardcoded `true` value following https://contentful.atlassian.net/browse/DANTE-486
        // TODO: refine permissions check in order to account for tags in rules
        const canCreate = creatableContentTypes.length > 0 || true;
        setCanCreateEntity(canCreate);
      }
    }

    void checkCreateAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
  }, [entityType, parameters.instance, creatableContentTypes]);

  useEffect(() => {
    if (parameters.instance.showLinkEntityAction === false) {
      setCanLinkEntity(false);
      return;
    }

    async function checkLinkAccess() {
      if (entityType === 'Asset') {
        // Hardcoded `true` value following https://contentful.atlassian.net/browse/DANTE-486
        // TODO: refine permissions check in order to account for tags in rules
        const canRead = (await canPerformAction('read', 'Asset')) || true;
        setCanLinkEntity(canRead);
      }
      if (entityType === 'Entry') {
        // Hardcoded `true` value following https://contentful.atlassian.net/browse/DANTE-486
        // TODO: refine permissions check in order to account for tags in rules
        // TODO: always show every content type (it's just a filter) to avoid people not seeing
        // their (partly limited) content types
        const canRead = true;
        setCanLinkEntity(canRead);
      }
    }

    void checkLinkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
  }, [entityType, parameters.instance]);

  return {
    canCreateEntity,
    canLinkEntity,
    creatableContentTypes,
    availableContentTypes,
    validations,
  };
}

export type EditorPermissions = ReturnType<typeof useEditorPermissions>;
