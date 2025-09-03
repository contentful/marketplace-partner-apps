import { ConfigAppSDK } from '@contentful/app-sdk';
import { CONTENT_TYPE_ID } from '@/constants';
import { ensureAppInSidebarAndEditor } from '@/services/ensureAppInSidebarAndEditor';

type props = {
  sdk: ConfigAppSDK;
};

export async function createAbTastyContainerContentType({ sdk }: props) {
  try {
    const contentType = await sdk.cma.contentType.createWithId(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: CONTENT_TYPE_ID,
      },
      {
        name: 'AB Tasty Container',
        displayField: 'experimentName',
        description: 'Container for AB Tasty experiment and variation metadata.',
        fields: [
          {
            id: 'environmentId',
            name: 'Environment ID',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'environment',
            name: 'Environment Name',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'experimentID',
            name: 'Experiment ID',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'experimentName',
            name: 'Experiment Name',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'variations',
            name: 'Variations',
            type: 'Array',
            required: false,
            localized: false,
            items: {
              type: 'Link',
              linkType: 'Entry',
            },
          },
          {
            id: 'meta',
            name: 'Meta Mapping',
            type: 'Object',
            required: false,
            localized: false,
          },
          {
            id: 'projectId',
            name: 'Project ID',
            type: 'Symbol',
            required: false,
            localized: false,
          },
        ],
      }
    );

    await sdk.cma.contentType.publish(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: CONTENT_TYPE_ID,
      },
      contentType
    );

    await ensureAppInSidebarAndEditor(sdk, CONTENT_TYPE_ID);

    sdk.notifier.success('Content type created successfully');
  } catch (e: any) {
    console.log('Error creating content type: ', e.message || e.toString(), e.stack);
    sdk.notifier.error('Error creating content type: ' + (e.message || e.toString()));
  }
}
