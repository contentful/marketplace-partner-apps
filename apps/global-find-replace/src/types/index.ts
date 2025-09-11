/**
 * Type definitions for the Find & Replace utility
 */

export interface ContentType {
  sys: {
    id: string;
  };
  name: string;
  displayField?: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  id: string;
  type: string;
  items?: {
    type: string;
    linkType?: string;
  };
}

export interface Entry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: Record<string, Record<string, any>>;
}

export interface MatchField {
  id: string;
  name: string;
  contentType: string;
  entryId: string;
  field: string;
  original: string;
  updated: string;
  index?: number;
  diffLines: DiffLine[];
}

export interface SearchFilters {
  find: string;
  replace: string;
  selectedContentTypes: string[];
  locale: string;
  caseSensitive: boolean;
  includeAllFields: boolean;
}

export interface AppState extends SearchFilters {
  contentTypes: ContentType[];
  locales: string[];
  searching: boolean;
  fields: MatchField[];
  selectedEntries: Record<string, boolean>;
  publishAfterUpdate: boolean;
  pageSize: number;
  currentPage: number;
  showSummary: boolean;
  appliedChanges: MatchField[];
  contentTypeDropdownOpen: boolean;
  applyingChanges: boolean;
  formModifiedSinceSearch: boolean;
  resultsLoaded: boolean;
  spaceId: string;
  confirmationModalShown: boolean;
  processedCount: number;
  environment: string;
}

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export interface ReplaceResult {
  original: string;
  updated: string;
  index?: number;
  diffLines: DiffLine[];
}

export interface DiffLine {
  diffOriginal: string;
  diffUpdated: string;
}

export interface BuildMatchEntriesParams {
  entry: Entry;
  field: any;
  fieldName: string;
  fieldDef: FieldDefinition;
  contentTypes: ContentType[];
  locale: string;
  find: string;
  replace: string;
  caseSensitive?: boolean;
}

export interface SearchEntriesParams {
  contentTypeIds: string[];
  contentTypes: ContentType[];
  locale: string;
  find: string;
  replace: string;
  caseSensitive?: boolean;
  searchAllFields?: boolean;
}
