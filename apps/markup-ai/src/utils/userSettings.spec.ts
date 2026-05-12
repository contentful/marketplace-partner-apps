import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllUserSettings, getUserSettings, setApiKey } from "./userSettings";

describe("userSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns apiKey=null when no key is stored", () => {
    expect(getUserSettings()).toEqual({ apiKey: null });
  });

  it("persists an apiKey and reads it back", () => {
    setApiKey("token-123");
    expect(getUserSettings().apiKey).toBe("token-123");
    expect(localStorage.getItem("markupai.apiKey")).toBe("token-123");
  });

  it("removes the apiKey when set to null", () => {
    setApiKey("token-123");
    setApiKey(null);
    expect(getUserSettings().apiKey).toBeNull();
    expect(localStorage.getItem("markupai.apiKey")).toBeNull();
  });

  it("clearAllUserSettings wipes the apiKey", () => {
    setApiKey("token-123");
    clearAllUserSettings();
    expect(getUserSettings().apiKey).toBeNull();
  });

  it("dispatches a storage event when setApiKey runs so cross-location sync can react", () => {
    const listener = vi.fn();
    globalThis.addEventListener("storage", listener);

    setApiKey("token-123");
    expect(listener).toHaveBeenCalledTimes(1);

    setApiKey(null);
    expect(listener).toHaveBeenCalledTimes(2);

    globalThis.removeEventListener("storage", listener);
  });

  it("dispatches a storage event when clearAllUserSettings runs", () => {
    const listener = vi.fn();
    globalThis.addEventListener("storage", listener);

    clearAllUserSettings();
    expect(listener).toHaveBeenCalledTimes(1);

    globalThis.removeEventListener("storage", listener);
  });
});
