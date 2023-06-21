export const DEFAULT_CONTENT_TYPE_NAME = 'Ceros Experience';
export const DEFAULT_CONTENT_TYPE_ID = 'cerosExperience';

export const DEFAULT_CONTENT_TYPE = {
  name: DEFAULT_CONTENT_TYPE_NAME,
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      required: true,
      localized: false,
    },
    {
      id: 'url',
      name: 'URL',
      type: 'Symbol',
      required: true,
      localized: false,
    },
    {
      id: 'embedCode',
      name: 'Embed Code',
      type: 'Text',
      required: true,
      localized: false,
    },
  ],
};
