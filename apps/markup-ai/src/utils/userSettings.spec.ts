import { describe, it, expect, beforeEach } from "vitest";
import {
  getUserSettings,
  ensureDefaultUserSettings,
  setApiKey,
  setDialect,
  setTone,
  setStyleGuide,
  clearAllUserSettings,
} from "./userSettings";

describe("userSettings utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("ensures defaults and gets settings", () => {
    ensureDefaultUserSettings();
    const s = getUserSettings();
    expect(s.dialect).toBeTruthy();
    expect(s.tone).toBeNull();
    expect(s.styleGuide).toBeTruthy();
  });

  it("sets and clears values", () => {
    setApiKey("a");
    setDialect("en-US");
    setTone("neutral");
    setStyleGuide("default");
    let s = getUserSettings();
    expect(s.apiKey).toBe("a");

    clearAllUserSettings();
    s = getUserSettings();
    expect(s.apiKey).toBeNull();
  });
});
