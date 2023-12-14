/**
 * @returns {import("contentful-management").Entry}
 */
export const mockEntry = () => ({
  fields: {
    title: {
      [defaultLocale]: ''
    },
    lilt_status: {
      [defaultLocale]: ''
    },
    lilt_metadata: {
      [defaultLocale]: {}
    }
  },
  displayField: 'title',
  sys: {
    id: '',
    version: 1,
    createdAt: '2022-04-25T13:22:29.258Z',
    updatedAt: '2022-04-26T13:22:29.258Z',
    contentType: {
      sys: {
        id: ''
      }
    }
  }
});

const defaultLocale = 'en-US';
