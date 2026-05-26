export type UserSettings = {
  apiKey: string | null;
};

const STORAGE_KEYS = {
  apiKey: "markupai.apiKey",
} as const;

export function getUserSettings(): UserSettings {
  if (typeof globalThis === "undefined") {
    return { apiKey: null };
  }
  return {
    apiKey: localStorage.getItem(STORAGE_KEYS.apiKey),
  };
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

export function clearAllUserSettings() {
  if (typeof globalThis === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  dispatchStorageEvent();
}

function dispatchStorageEvent() {
  try {
    globalThis.dispatchEvent(new StorageEvent("storage"));
  } catch {
    // no-op
  }
}
