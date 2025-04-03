import { useEffect, useMemo, useState } from 'react';

import { AccessAPI, ContentEntityType, ContentType } from '@contentful/app-sdk';

import { useAccessApi } from '../field-editor-reference/common/useAccessApi';
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
  validations: {
    contentTypes?: string[];
  };
};

export function useEditorPermissions(props: EditorPermissionsProps) {
  const { access, entityType, parameters } = props;
  const { instance } = parameters;
  const { showCreateEntityAction } = instance;
  const [canCreateEntity, setCanCreateEntity] = useState(true);
  const [canLinkEntity, setCanLinkEntity] = useState(true);
  const { creatableContentTypes, availableContentTypes } = useContentTypePermissions({
    ...props,
  });
  const { canPerformAction } = useAccessApi(access);

  useEffect(() => {
    if (showCreateEntityAction === false) {
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
  }, [canPerformAction, creatableContentTypes.length, entityType, showCreateEntityAction]);

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
    // eslint-disable-next-line -- TODO: Evaluate the dependencies
  }, [entityType, parameters.instance]);

  return {
    canCreateEntity,
    canLinkEntity,
    creatableContentTypes,
    availableContentTypes,
    validations: props.validations,
  };
}

export type EditorPermissions = ReturnType<typeof useEditorPermissions>;
