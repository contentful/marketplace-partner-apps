import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUserSettings } from "./useUserSettings";

describe("useUserSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with defaults and updates values", () => {
    const { result } = renderHook(() => useUserSettings());
    expect(result.current.settings.dialect).toBeTruthy();
    expect(result.current.settings.tone).toBeNull();
    act(() => {
      result.current.updateApiKey("abc");
    });
    expect(result.current.settings.apiKey).toBe("abc");

    act(() => {
      result.current.updateDialect("en-US");
    });
    expect(result.current.settings.dialect).toBe("en-US");

    act(() => {
      result.current.updateTone("neutral");
    });
    expect(result.current.settings.tone).toBe("neutral");

    act(() => {
      result.current.updateStyleGuide("default");
    });
    expect(result.current.settings.styleGuide).toBe("default");
  });
});
