export type UserSettings = {
  apiKey: string | null;
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
};

const STORAGE_KEYS = {
  apiKey: 'markupai.apiKey',
  dialect: 'markupai.dialect',
  tone: 'markupai.tone',
  styleGuide: 'markupai.styleGuide',
} as const;

export const DEFAULTS = {
  dialect: 'american_english',
  styleGuide: 'microsoft',
} as const;

export function getUserSettings(): UserSettings {
  if (typeof globalThis === 'undefined') {
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
  if (typeof globalThis === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.dialect)) {
    localStorage.setItem(STORAGE_KEYS.dialect, DEFAULTS.dialect);
  }
  if (!localStorage.getItem(STORAGE_KEYS.styleGuide)) {
    localStorage.setItem(STORAGE_KEYS.styleGuide, DEFAULTS.styleGuide);
  }
}

export function setApiKey(apiKey: string | null) {
  if (typeof globalThis === 'undefined') return;
  if (apiKey) {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.apiKey);
  }
  dispatchStorageEvent();
}

export function setDialect(dialect: string | null) {
  if (typeof globalThis === 'undefined') return;
  if (dialect) {
    localStorage.setItem(STORAGE_KEYS.dialect, dialect);
  } else {
    localStorage.removeItem(STORAGE_KEYS.dialect);
  }
  dispatchStorageEvent();
}

export function setTone(tone: string | null) {
  if (typeof globalThis === 'undefined') return;
  if (tone) {
    localStorage.setItem(STORAGE_KEYS.tone, tone);
  } else {
    localStorage.removeItem(STORAGE_KEYS.tone);
  }
  dispatchStorageEvent();
}

export function setStyleGuide(styleGuide: string | null) {
  if (typeof globalThis === 'undefined') return;
  if (styleGuide) {
    localStorage.setItem(STORAGE_KEYS.styleGuide, styleGuide);
  } else {
    localStorage.removeItem(STORAGE_KEYS.styleGuide);
  }
  dispatchStorageEvent();
}

export function clearAllUserSettings() {
  if (typeof globalThis === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem(STORAGE_KEYS.dialect);
  localStorage.removeItem(STORAGE_KEYS.tone);
  localStorage.removeItem(STORAGE_KEYS.styleGuide);
  dispatchStorageEvent();
}

function dispatchStorageEvent() {
  try {
    // Notify listeners in the same tab
    globalThis.dispatchEvent(new StorageEvent('storage'));
  } catch {
    // no-op
  }
}
