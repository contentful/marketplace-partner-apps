/**
 * Types for app installation configuration and content type settings
 */

/**
 * Settings for style guide, dialect, and tone that can be applied
 * at content type level (defaults) or field level (overrides)
 */
export interface ContentTypeSettings {
  styleGuide: string | null;
  dialect: string | null;
  tone: string | null;
}

/**
 * Map of content type IDs to their settings
 */
export interface ContentTypeSettingsMap {
  [contentTypeId: string]: ContentTypeSettings;
}

/**
 * App installation parameters stored in Contentful
 */
export interface AppInstallationParameters {
  /**
   * Content type level default settings for style guide, dialect, and tone
   * These are used as fallback when field-level settings are not set
   */
  contentTypeSettings?: ContentTypeSettingsMap;
}

/**
 * Default empty settings for a content type
 */
export const DEFAULT_CONTENT_TYPE_SETTINGS: ContentTypeSettings = {
  styleGuide: null,
  dialect: null,
  tone: null,
};

/**
 * Check if a content type has any settings configured
 */
export function hasContentTypeSettings(settings: ContentTypeSettings | undefined): boolean {
  if (!settings) return false;
  return !!(settings.styleGuide || settings.dialect || settings.tone);
}
