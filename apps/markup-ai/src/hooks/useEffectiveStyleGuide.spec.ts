import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useEffectiveStyleGuide } from "./useEffectiveStyleGuide";
import { getFieldStyleGuideKey, type FieldStyleGuideScope } from "../utils/fieldStyleGuide";

const SCOPE: FieldStyleGuideScope = {
  spaceId: "space-1",
  environmentId: "master",
  contentTypeId: "article",
  fieldId: "title",
};

describe("useEffectiveStyleGuide", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns none when nothing is set", () => {
    const { result } = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: undefined }),
    );
    expect(result.current.effectiveStyleGuideId).toBeNull();
    expect(result.current.source).toBe("none");
  });

  it("falls through to the content-type default when no field override exists", () => {
    const { result } = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: { styleGuide: "sg-ct" } }),
    );
    expect(result.current.effectiveStyleGuideId).toBe("sg-ct");
    expect(result.current.source).toBe("contentType");
  });

  it("prefers the field override over the content-type default", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-field");
    const { result } = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: { styleGuide: "sg-ct" } }),
    );
    expect(result.current.effectiveStyleGuideId).toBe("sg-field");
    expect(result.current.source).toBe("field");
  });

  it("setFieldStyleGuide updates the effective value to the new override", () => {
    const { result } = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: { styleGuide: "sg-ct" } }),
    );
    act(() => {
      result.current.setFieldStyleGuide("sg-new");
    });
    expect(result.current.effectiveStyleGuideId).toBe("sg-new");
    expect(result.current.source).toBe("field");
  });

  it("clears back to the content-type default when override is set to null", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-field");
    const { result } = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: { styleGuide: "sg-ct" } }),
    );
    act(() => {
      result.current.setFieldStyleGuide(null);
    });
    expect(result.current.effectiveStyleGuideId).toBe("sg-ct");
    expect(result.current.source).toBe("contentType");
  });

  it("scopes overrides per (space, env) so the same content-type/field can carry different values", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-master");
    localStorage.setItem(
      getFieldStyleGuideKey({ ...SCOPE, environmentId: "staging" }),
      "sg-staging",
    );
    const master = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, contentTypeDefault: undefined }),
    );
    const staging = renderHook(() =>
      useEffectiveStyleGuide({ ...SCOPE, environmentId: "staging", contentTypeDefault: undefined }),
    );
    expect(master.result.current.effectiveStyleGuideId).toBe("sg-master");
    expect(staging.result.current.effectiveStyleGuideId).toBe("sg-staging");
  });
});
