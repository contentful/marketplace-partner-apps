export type UserSettings = {
  apiKey: string | null;
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
};

/**
 * Field-specific settings stored per content type and field ID
 */
export type FieldSettings = {
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
};

const STORAGE_KEYS = {
  apiKey: "markupai.apiKey",
  dialect: "markupai.dialect",
  tone: "markupai.tone",
  styleGuide: "markupai.styleGuide",
  // Per-field settings prefix
  fieldSettings: "markupai.field",
} as const;

/**
 * Well-known style guide IDs from the API.
 * These are system-defined style guides that are always available.
 * Source: GET /constants endpoint - style_guides field
 */
export const STYLE_GUIDE_IDS = {
  AP: "01971e03-dd27-75ee-9044-b48e654848cf",
  CHICAGO: "01971e03-dd27-77d8-a6fa-5edb6a1f4ad2",
  MICROSOFT: "01971e03-dd27-779f-b3ec-b724a2cf809f",
} as const;

/**
 * Default values for style settings.
 * These are the hardcoded defaults when no user or content type settings exist.
 */
export const DEFAULTS = {
  dialect: "american_english",
  styleGuide: STYLE_GUIDE_IDS.MICROSOFT,
  styleGuideName: "microsoft",
} as const;

/**
 * Special value indicating the user explicitly chose "no tone"
 * This is different from null (which means "use default/fallback")
 */
export const TONE_NONE = "__none__" as const;

/**
 * Get the storage key for field-specific settings
 */
function getFieldSettingsKey(contentTypeId: string, fieldId: string): string {
  return `${STORAGE_KEYS.fieldSettings}.${contentTypeId}.${fieldId}`;
}

/**
 * Get field-specific settings from localStorage
 * Returns null values if no settings are stored for this field
 */
export function getFieldSettings(contentTypeId: string, fieldId: string): FieldSettings {
  if (typeof globalThis === "undefined") {
    return { dialect: null, tone: null, styleGuide: null };
  }

  const key = getFieldSettingsKey(contentTypeId, fieldId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return { dialect: null, tone: null, styleGuide: null };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<FieldSettings>;
    return {
      dialect: parsed.dialect ?? null,
      tone: parsed.tone ?? null,
      styleGuide: parsed.styleGuide ?? null,
    };
  } catch {
    return { dialect: null, tone: null, styleGuide: null };
  }
}

/**
 * Set field-specific settings in localStorage
 */
export function setFieldSettings(
  contentTypeId: string,
  fieldId: string,
  settings: Partial<FieldSettings>,
): void {
  if (typeof globalThis === "undefined") return;

  const key = getFieldSettingsKey(contentTypeId, fieldId);
  const current = getFieldSettings(contentTypeId, fieldId);
  const updated: FieldSettings = {
    dialect: settings.dialect === undefined ? current.dialect : settings.dialect,
    tone: settings.tone === undefined ? current.tone : settings.tone,
    styleGuide: settings.styleGuide === undefined ? current.styleGuide : settings.styleGuide,
  };

  // Only store if at least one value is set
  if (updated.dialect || updated.tone || updated.styleGuide) {
    localStorage.setItem(key, JSON.stringify(updated));
  } else {
    // Remove the key if all values are null
    localStorage.removeItem(key);
  }

  dispatchStorageEvent();
}

/**
 * Clear field-specific settings
 */
export function clearFieldSettings(contentTypeId: string, fieldId: string): void {
  if (typeof globalThis === "undefined") return;
  const key = getFieldSettingsKey(contentTypeId, fieldId);
  localStorage.removeItem(key);
  dispatchStorageEvent();
}

export function getUserSettings(): UserSettings {
  if (typeof globalThis === "undefined") {
    return { apiKey: null, dialect: null, tone: null, styleGuide: null };
  }
  return {
    apiKey: localStorage.getItem(STORAGE_KEYS.apiKey),
    dialect: localStorage.getItem(STORAGE_KEYS.dialect) || DEFAULTS.dialect,
    tone: localStorage.getItem(STORAGE_KEYS.tone),
    styleGuide: localStorage.getItem(STORAGE_KEYS.styleGuide) || DEFAULTS.styleGuide,
  };
}

export function ensureDefaultUserSettings() {
  if (typeof globalThis === "undefined") return;
  if (!localStorage.getItem(STORAGE_KEYS.dialect)) {
    localStorage.setItem(STORAGE_KEYS.dialect, DEFAULTS.dialect);
  }
  if (!localStorage.getItem(STORAGE_KEYS.styleGuide)) {
    localStorage.setItem(STORAGE_KEYS.styleGuide, DEFAULTS.styleGuide);
  }
}

export function setApiKey(apiKey: string | null) {
  if (typeof globalThis === "undefined") return;
  if (apiKey) {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.apiKey);
  }
  dispatchStorageEvent();
}

export function setDialect(dialect: string | null) {
  if (typeof globalThis === "undefined") return;
  if (dialect) {
    localStorage.setItem(STORAGE_KEYS.dialect, dialect);
  } else {
    localStorage.removeItem(STORAGE_KEYS.dialect);
  }
  dispatchStorageEvent();
}

export function setTone(tone: string | null) {
  if (typeof globalThis === "undefined") return;
  if (tone) {
    localStorage.setItem(STORAGE_KEYS.tone, tone);
  } else {
    localStorage.removeItem(STORAGE_KEYS.tone);
  }
  dispatchStorageEvent();
}

export function setStyleGuide(styleGuide: string | null) {
  if (typeof globalThis === "undefined") return;
  if (styleGuide) {
    localStorage.setItem(STORAGE_KEYS.styleGuide, styleGuide);
  } else {
    localStorage.removeItem(STORAGE_KEYS.styleGuide);
  }
  dispatchStorageEvent();
}

export function clearAllUserSettings() {
  if (typeof globalThis === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem(STORAGE_KEYS.dialect);
  localStorage.removeItem(STORAGE_KEYS.tone);
  localStorage.removeItem(STORAGE_KEYS.styleGuide);
  dispatchStorageEvent();
}

function dispatchStorageEvent() {
  try {
    // Notify listeners in the same tab
    globalThis.dispatchEvent(new StorageEvent("storage"));
  } catch {
    // no-op
  }
}
