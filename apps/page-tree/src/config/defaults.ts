import type { AppConfig } from "../core/types";

/** The path served by the Page location (App Definition → Pages). */
export const SITEMAP_PAGE_PATH = "/sitemap";

export const DEFAULT_CONFIG: AppConfig = {
  baseUrl: "",
  locale: "en-US",
  detectOrphans: true,
  sources: [
    {
      contentTypeId: "page",
      pathFieldId: "pagePath",
      titleFieldId: "title",
    },
  ],
};
