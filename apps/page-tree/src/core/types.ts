export type ContentState = "published" | "draft" | "changed";

export type TreeSourceConfig = {
  contentTypeId: string;
  pathFieldId: string; // e.g. 'pagePath'
  titleFieldId?: string; // e.g. 'title'
  routePrefix?: string; // NEW (e.g. "", "/", "/news", "/events")
};

export type AppConfig = {
  baseUrl: string; // required; used for Preview URL: baseUrl + path
  locale: string; // V1 default: 'en-US'
  sources: TreeSourceConfig[];
  detectOrphans?: boolean; // default true; set to false to disable orphan-page detection
};

/** An entry that could not be placed in the tree because its path/slug field is empty. */
export type MissingPathEntry = {
  entryId: string;
  contentTypeId: string;
  title?: string;
  state: ContentState;
};

export type TreeItem = {
  entryId: string;
  contentTypeId: string;
  path: string; // absolute, e.g. /news/foo
  title?: string;
  state: ContentState;
};

export type TreeNode = {
  path: string; // absolute
  label: string;
  entryId?: string;
  state?: ContentState;
  children: TreeNode[];
};

export type CMAEntrySysLike = {
  id: string;
  version?: number;
  publishedVersion?: number;
};

export type CMAEntryLike = {
  sys: CMAEntrySysLike;
  fields: Record<string, unknown>;
};

export type CMAGetManyResponseLike<T> = {
  items: T[];
  total?: number;
  skip?: number;
  limit?: number;
};

export type CMAClientLike = {
  entry: {
    getMany: (args: {
      query: {
        content_type: string;
        limit: number;
        skip: number;
        order?: string;
      };
    }) => Promise<CMAGetManyResponseLike<CMAEntryLike>>;
  };
};

export type SdkWithCma = { cma: CMAClientLike };

export type CmaContentTypeFieldLike = {
  id: string;
  name: string;
  type: string;
};

export type CmaContentTypeLike = {
  sys: { id: string };
  name: string;
  fields?: CmaContentTypeFieldLike[];
};

export type CmaGetManyResponseLike<T> = {
  items?: T[];
};
