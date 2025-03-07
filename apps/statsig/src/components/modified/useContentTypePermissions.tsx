import { useEffect, useMemo, useState } from 'react';

import { AccessAPI, ContentEntityType, ContentType } from '@contentful/app-sdk';

import { useAccessApi } from '../field-editor-reference/common/useAccessApi';

type ContentTypePermissionsProps = {
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

type ContentTypePermissions = {
  creatableContentTypes: ContentType[];
  availableContentTypes: ContentType[];
};

async function filter<T, S extends T>(arr: T[], predicate: (value: T) => Promise<boolean>) {
  // intentionally parallel as we assume it's cached in the implementation of the access api
  const fail = Symbol();
  const results = await Promise.all(
    arr.map(async (item) => ((await predicate(item)) ? item : fail)),
  );

  return results.filter((x) => x !== fail) as S[];
}

export function useContentTypePermissions(
  props: ContentTypePermissionsProps,
): ContentTypePermissions {
  const availableContentTypes = useMemo(() => {
    if (props.entityType === 'Asset') {
      return [];
    }

    if (props.validations.contentTypes) {
      return props.allContentTypes.filter((ct) =>
        props.validations.contentTypes?.includes(ct.sys.id),
      );
    }

    return props.allContentTypes;
  }, [props.allContentTypes, props.entityType, props.validations.contentTypes]);
  const [creatableContentTypes, setCreatableContentTypes] = useState(availableContentTypes);
  const { canPerformActionOnEntryOfType } = useAccessApi(props.access);

  useEffect(() => {
    function getContentTypes(action: 'create' | 'read') {
      return filter(availableContentTypes, (ct) =>
        canPerformActionOnEntryOfType(action, ct.sys.id),
      );
    }

    async function checkContentTypeAccess() {
      const creatable = await getContentTypes('create');
      setCreatableContentTypes(creatable);
    }

    void checkContentTypeAccess();
  }, [availableContentTypes, canPerformActionOnEntryOfType]);

  return {
    creatableContentTypes,
    availableContentTypes,
  };
}
