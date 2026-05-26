/**
 * Per-content-type defaults set on the app config screen and stored in
 * Contentful app installation parameters. Today only `styleGuide` is
 * configurable; the type is shaped this way so we can extend it without
 * churning every consumer.
 */
export interface ContentTypeSettings {
  styleGuide: string | null;
}

/**
 * Indexing is `Partial<Record<...>>` so callers must handle the missing-entry
 * case explicitly — otherwise TS would treat every contentTypeId lookup as
 * always defined, hiding real "no settings configured" cases.
 */
export type ContentTypeSettingsMap = Partial<Record<string, ContentTypeSettings>>;

export interface AppInstallationParameters {
  contentTypeSettings?: ContentTypeSettingsMap;
}
