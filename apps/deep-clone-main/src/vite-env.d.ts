/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Type definitions for the app parameters
interface AppParameters {
  cloneText: string;
  cloneTextBefore: boolean;
  cloneAssets: boolean;
  automaticRedirect: boolean;
  msToRedirect: number;
  selectedContentTypes?: string[];
}

// Type definitions for references used in the cloning process
interface Reference {
  [entryId: string]: {
    sys: {
      id: string;
      type: string;
      version: number;
      contentType: {
        sys: {
          id: string;
          type: string;
          linkType: string;
        };
      };
    };
    fields: {
      [fieldName: string]: {
        [locale: string]: any;
      };
    };
  };
}
