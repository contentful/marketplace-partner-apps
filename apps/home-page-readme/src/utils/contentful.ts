//import sample markdown files from the examples folder
export const README_CONTENT_TYPE_ID = 'readmeMd';

// Creates a new ReadMe content type if needed
export async function createReadmeType(cma: any) {
  const { sys } = await cma.contentType.createWithId(
    { contentTypeId: README_CONTENT_TYPE_ID },
    {
      name: README_CONTENT_TYPE_ID,
      description: 'Used to populate the space home area with the rendered markdown',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          localized: false,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'readMe',
          name: 'ReadMe',
          type: 'Text',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    }
  );

  if (!sys) return;

  //now publish the type
  await cma.contentType.publish(
    {
      contentTypeId: sys.id,
    },
    {
      sys: {
        id: sys.id,
        version: sys.version,
      },
    }
  );

  return sys.id;
}

export async function createReadmeEntry(cma: any) {
  const entry = await cma.entry.create(
    {
      contentTypeId: README_CONTENT_TYPE_ID,
    },
    {
      fields: {
        title: {
          'en-US': 'README',
        },
        readMe: {
          'en-US': '## Add your own README.md content entrie and have fun!',
        },
      },
    }
  );

  await entry.publish();
}

// Need to make sure the readme content type exists
export async function checkForReadmeType(cma: any) {
  console.log('Checking for ReadMe content type');
  const returnValue = await cma.contentType
    .get({
      contentTypeId: README_CONTENT_TYPE_ID,
    })
    .catch((err: any) => {});

  return returnValue ? true : false;
}

export async function checkForReadmeEntries(cma: any) {
  // Find the ReadMe entries
  const { items } = await cma.entry
    .getMany({
      query: { content_type: README_CONTENT_TYPE_ID },
    })
    .catch((err: any) => {
      return [];
    });

  return items;
}
