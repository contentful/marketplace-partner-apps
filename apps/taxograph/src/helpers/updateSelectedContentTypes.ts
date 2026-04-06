import { ContentTypeProps } from 'contentful-management';
import { ConfigAppSDK, CMAClient } from '@contentful/app-sdk';

import { config } from '../config';

interface UpdateSelectedContentTypesProps {
  client: CMAClient
  selectedContentTypes: string[]
  selectedSchemas: string[]
  contentTypes: ContentTypeProps[]
  sdk: ConfigAppSDK
}

export function updateSelectedContentTypes({ client, selectedContentTypes, contentTypes, sdk, selectedSchemas }: UpdateSelectedContentTypesProps) {
  return selectedContentTypes.map(async contentType => {
    const existingContentType = contentTypes.find(item => item.sys.id === contentType);

    if (!existingContentType)
      return;

    const existingField = existingContentType?.fields?.find((field: any) => field.id === config.editorField.id);

    if (!existingField) {
      existingContentType.fields = [
        ...existingContentType.fields,
        {
          id: config.editorField.id,
          localized: false,
          name: config.editorField.name,
          required: false,
          type: config.editorField.type,
        }
      ]
    }

    if (selectedSchemas.length > 0) {
      existingContentType.metadata = {
        ...existingContentType.metadata,

        taxonomy: selectedSchemas.map(schema => {
          return {
            sys: {
              type: 'Link',
              linkType: 'TaxonomyConceptScheme',
              id: schema
            }
          }
        })
      }
    }

    const updatedContentType = await client.contentType.update({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId: contentType,
    }, {
      ...existingContentType
    });

    return client.contentType.publish({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId: contentType,
    }, {
      ...updatedContentType
    });
  });
}