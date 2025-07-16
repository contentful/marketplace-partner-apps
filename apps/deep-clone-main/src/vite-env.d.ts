/// <reference types="vite/client" />

export interface AppParameters {
  cloneText: string;
  cloneTextBefore: boolean;
  cloneAssets: boolean;
  automaticRedirect: boolean;
  msToRedirect: number;
  selectedContentTypes?: string[];
}
