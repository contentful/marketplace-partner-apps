/**
 *
 * @returns {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 */
export function mockSdk() {
  return {
    ids: {},
    access: {
      can: () => true
    },
    locales: {
      available: ['en-US', 'de-DE', 'es'],
      default: 'en-US',
      names: {
        'de-DE': 'German (Germany)',
        'en-US': 'English (United States)',
        es: 'Spanish',
        fr: 'French'
      },
      optional: {
        'de-DE': true,
        'en-US': false,
        es: true,
        fr: false
      }
    },
    parameters: {
      invocation: {},
      installation: {}
    },
    app: {
      getParameters: () => ({ parameters: {} }),
      setReady: () => {},
      onConfigure: () => {}
    },
    space: {
      getContentType: () => ({ fields: [] }),
      getContentTypes: () => ({ items: [] }),
      updateContentType: () => {}
    },
    entry: {
      getSys: () => ({ publishedCounter: 1 }),
      onSysChanged: () => {},
      fields: {
        lilt_status: {
          locales: [],
          getValue: () => {},
          setValue: () => {},
          onValueChanged: () => {}
        },
        lilt_metadata: {
          locales: [],
          getValue: () => ({}),
          setValue: () => {},
          onValueChanged: () => {}
        }
      }
    },
    dialogs: {
      openAlert: () => {}
    },
    close: () => {},
    window: {
      startAutoResizer: () => {}
    },
    cmaAdapter: {
      makeRequest: () => {}
    }
  };
}
