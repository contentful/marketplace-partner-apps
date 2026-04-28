import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUserSettings } from "./useUserSettings";
import { TONE_NONE, DEFAULTS } from "../utils/userSettings";

describe("useUserSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with defaults and updates apiKey globally", () => {
    const { result } = renderHook(() => useUserSettings());
    expect(result.current.effectiveSettings.dialect).toBeTruthy();
    // Default tone is TONE_NONE (no tone)
    expect(result.current.effectiveSettings.tone).toBe(TONE_NONE);
    act(() => {
      result.current.updateApiKey("abc");
    });
    expect(result.current.effectiveSettings.apiKey).toBe("abc");
  });

  it("updates field-specific settings when contentTypeId and fieldId are provided", () => {
    const { result } = renderHook(() =>
      useUserSettings({
        contentTypeId: "blogPost",
        fieldId: "title",
      }),
    );

    // Initial state should use defaults
    expect(result.current.effectiveSettings.dialect).toBe(DEFAULTS.dialect);
    // Default tone is TONE_NONE (no tone)
    expect(result.current.effectiveSettings.tone).toBe(TONE_NONE);
    expect(result.current.effectiveSettings.styleGuide).toBe(DEFAULTS.styleGuide);

    // Update field-specific dialect
    act(() => {
      result.current.updateDialect("en-US");
    });
    expect(result.current.effectiveSettings.dialect).toBe("en-US");
    expect(result.current.fieldSettings.dialect).toBe("en-US");

    // Update field-specific tone
    act(() => {
      result.current.updateTone("neutral");
    });
    expect(result.current.effectiveSettings.tone).toBe("neutral");
    expect(result.current.fieldSettings.tone).toBe("neutral");

    // Update field-specific style guide
    act(() => {
      result.current.updateStyleGuide("default");
    });
    expect(result.current.effectiveSettings.styleGuide).toBe("default");
    expect(result.current.fieldSettings.styleGuide).toBe("default");
  });

  it("uses content type defaults when no field settings exist", () => {
    const contentTypeDefaults = {
      dialect: "british_english",
      tone: "formal",
      styleGuide: "ap_stylebook",
    };

    const { result } = renderHook(() =>
      useUserSettings({
        contentTypeId: "blogPost",
        fieldId: "body",
        contentTypeDefaults,
      }),
    );

    // Should use content type defaults
    expect(result.current.effectiveSettings.dialect).toBe("british_english");
    expect(result.current.effectiveSettings.tone).toBe("formal");
    expect(result.current.effectiveSettings.styleGuide).toBe("ap_stylebook");
    expect(result.current.isUsingContentTypeDefault.dialect).toBe(true);
    expect(result.current.isUsingContentTypeDefault.tone).toBe(true);
    expect(result.current.isUsingContentTypeDefault.styleGuide).toBe(true);
  });

  it("prioritizes field settings over content type defaults", () => {
    const contentTypeDefaults = {
      dialect: "british_english",
      tone: "formal",
      styleGuide: "ap_stylebook",
    };

    const { result } = renderHook(() =>
      useUserSettings({
        contentTypeId: "blogPost",
        fieldId: "title",
        contentTypeDefaults,
      }),
    );

    // Set field-specific setting
    act(() => {
      result.current.updateDialect("canadian_english");
    });

    // Field setting should override content type default
    expect(result.current.effectiveSettings.dialect).toBe("canadian_english");
    expect(result.current.isUsingContentTypeDefault.dialect).toBe(false);

    // Other settings should still use content type defaults
    expect(result.current.effectiveSettings.tone).toBe("formal");
    expect(result.current.isUsingContentTypeDefault.tone).toBe(true);
  });
});
