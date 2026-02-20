import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getUserSettings,
  setApiKey,
  getFieldSettings,
  setFieldSettings,
  UserSettings,
  FieldSettings,
  DEFAULTS,
  TONE_NONE,
} from "../utils/userSettings";
import type { ContentTypeSettings } from "../types/appConfig";

export interface UseUserSettingsOptions {
  /**
   * Content type ID for field-specific settings storage
   */
  contentTypeId?: string;
  /**
   * Field ID for field-specific settings storage
   */
  fieldId?: string;
  /**
   * Content type default settings to use as fallback when field-level settings are not set
   * These are set in the app config screen and stored in app installation parameters
   */
  contentTypeDefaults?: ContentTypeSettings;
}

export interface UseUserSettingsReturn {
  /**
   * @deprecated Use effectiveSettings instead. This is kept for backward compatibility.
   * Returns effectiveSettings (merged field + content type + global settings)
   */
  settings: UserSettings;
  /** Global user settings (apiKey, etc.) */
  globalSettings: UserSettings;
  /** Field-specific settings from localStorage */
  fieldSettings: FieldSettings;
  /** Content type defaults from config screen */
  contentTypeDefaults: ContentTypeSettings | undefined;
  /**
   * Effective settings: priority order is:
   * 1. Field-specific settings (localStorage per content type + field)
   * 2. Content type defaults (from config screen)
   * 3. Global defaults
   */
  effectiveSettings: UserSettings;
  /** Whether the current field has its own settings (not using defaults) */
  hasFieldSettings: {
    dialect: boolean;
    tone: boolean;
    styleGuide: boolean;
  };
  /** Whether using content type defaults (not field settings, but has content type default) */
  isUsingContentTypeDefault: {
    dialect: boolean;
    tone: boolean;
    styleGuide: boolean;
  };
  updateApiKey: (apiKey: string | null) => void;
  updateDialect: (dialect: string | null) => void;
  updateTone: (tone: string | null) => void;
  updateStyleGuide: (styleGuide: string | null) => void;
}

export function useUserSettings(options: UseUserSettingsOptions = {}): UseUserSettingsReturn {
  const { contentTypeId, fieldId, contentTypeDefaults } = options;

  // Global settings (apiKey)
  const [globalSettings, setGlobalSettings] = useState<UserSettings>(() => {
    return getUserSettings();
  });

  // Field-specific settings (using _setFieldSettings to avoid collision with imported setFieldSettings)
  const [fieldSettings, _setFieldSettings] = useState<FieldSettings>(() => {
    if (contentTypeId && fieldId) {
      return getFieldSettings(contentTypeId, fieldId);
    }
    return { dialect: null, tone: null, styleGuide: null };
  });

  // Update field settings when contentTypeId or fieldId changes
  useEffect(() => {
    if (contentTypeId && fieldId) {
      _setFieldSettings(getFieldSettings(contentTypeId, fieldId));
    } else {
      _setFieldSettings({ dialect: null, tone: null, styleGuide: null });
    }
  }, [contentTypeId, fieldId]);

  // Listen for storage events
  useEffect(() => {
    const onStorage = () => {
      setGlobalSettings(getUserSettings());
      if (contentTypeId && fieldId) {
        _setFieldSettings(getFieldSettings(contentTypeId, fieldId));
      }
    };
    globalThis.addEventListener("storage", onStorage);
    return () => {
      globalThis.removeEventListener("storage", onStorage);
    };
  }, [contentTypeId, fieldId]);

  const updateApiKey = useCallback((apiKey: string | null) => {
    setApiKey(apiKey);
    setGlobalSettings(getUserSettings());
  }, []);

  const updateDialect = useCallback(
    (dialect: string | null) => {
      if (contentTypeId && fieldId) {
        setFieldSettings(contentTypeId, fieldId, { dialect });
        _setFieldSettings(getFieldSettings(contentTypeId, fieldId));
      }
    },
    [contentTypeId, fieldId],
  );

  const updateTone = useCallback(
    (tone: string | null) => {
      if (contentTypeId && fieldId) {
        setFieldSettings(contentTypeId, fieldId, { tone });
        _setFieldSettings(getFieldSettings(contentTypeId, fieldId));
      }
    },
    [contentTypeId, fieldId],
  );

  const updateStyleGuide = useCallback(
    (styleGuide: string | null) => {
      if (contentTypeId && fieldId) {
        setFieldSettings(contentTypeId, fieldId, { styleGuide });
        _setFieldSettings(getFieldSettings(contentTypeId, fieldId));
      }
    },
    [contentTypeId, fieldId],
  );

  // Check which settings come from field-specific storage
  const hasFieldSettings = useMemo(
    () => ({
      dialect: !!fieldSettings.dialect,
      tone: !!fieldSettings.tone,
      styleGuide: !!fieldSettings.styleGuide,
    }),
    [fieldSettings],
  );

  // Check which settings are using content type defaults
  const isUsingContentTypeDefault = useMemo(
    () => ({
      dialect: !fieldSettings.dialect && !!contentTypeDefaults?.dialect,
      tone: !fieldSettings.tone && !!contentTypeDefaults?.tone,
      styleGuide: !fieldSettings.styleGuide && !!contentTypeDefaults?.styleGuide,
    }),
    [fieldSettings, contentTypeDefaults],
  );

  /**
   * Effective settings: priority order is:
   * 1. Field-specific settings (localStorage per content type + field)
   * 2. Content type defaults (from config screen)
   * 3. Global defaults (DEFAULTS constants)
   */
  const effectiveSettings = useMemo((): UserSettings => {
    // For tone, we need to distinguish between:
    // - TONE_NONE: user explicitly chose "None" (no tone) - this is also the default
    // - null: no preference set, use fallback
    // - string value: specific tone chosen
    const effectiveTone = (() => {
      if (fieldSettings.tone === TONE_NONE) {
        // User explicitly chose "None" - return TONE_NONE marker
        return TONE_NONE;
      }
      if (fieldSettings.tone) {
        // User chose a specific tone
        return fieldSettings.tone;
      }
      // Fall back to content type default or TONE_NONE (default is "no tone")
      return contentTypeDefaults?.tone || TONE_NONE;
    })();

    return {
      apiKey: globalSettings.apiKey,
      dialect: fieldSettings.dialect || contentTypeDefaults?.dialect || DEFAULTS.dialect,
      tone: effectiveTone,
      styleGuide:
        fieldSettings.styleGuide || contentTypeDefaults?.styleGuide || DEFAULTS.styleGuide,
    };
  }, [globalSettings, fieldSettings, contentTypeDefaults]);

  return {
    // Backward compatibility: settings is now an alias for effectiveSettings
    settings: effectiveSettings,
    globalSettings,
    fieldSettings,
    contentTypeDefaults,
    effectiveSettings,
    hasFieldSettings,
    isUsingContentTypeDefault,
    updateApiKey,
    updateDialect,
    updateTone,
    updateStyleGuide,
  };
}
