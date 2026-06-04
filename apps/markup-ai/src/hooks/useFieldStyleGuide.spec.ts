import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useFieldStyleGuide } from "./useFieldStyleGuide";
import { getFieldStyleGuideKey, type FieldStyleGuideScope } from "../utils/fieldStyleGuide";

const SCOPE: FieldStyleGuideScope = {
  spaceId: "space-1",
  environmentId: "master",
  contentTypeId: "article",
  fieldId: "title",
};

describe("useFieldStyleGuide", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts null when no value is stored", () => {
    const { result } = renderHook(() => useFieldStyleGuide(SCOPE));
    expect(result.current.fieldStyleGuide).toBeNull();
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-1");
    const { result } = renderHook(() => useFieldStyleGuide(SCOPE));
    expect(result.current.fieldStyleGuide).toBe("sg-1");
  });

  it("persists and exposes the new value", () => {
    const { result } = renderHook(() => useFieldStyleGuide(SCOPE));
    act(() => {
      result.current.setFieldStyleGuide("sg-new");
    });
    expect(result.current.fieldStyleGuide).toBe("sg-new");
    expect(localStorage.getItem(getFieldStyleGuideKey(SCOPE))).toBe("sg-new");
  });

  it("clears localStorage when set to null", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-1");
    const { result } = renderHook(() => useFieldStyleGuide(SCOPE));
    act(() => {
      result.current.setFieldStyleGuide(null);
    });
    expect(result.current.fieldStyleGuide).toBeNull();
    expect(localStorage.getItem(getFieldStyleGuideKey(SCOPE))).toBeNull();
  });

  it("re-reads when any scope dimension changes", () => {
    localStorage.setItem(getFieldStyleGuideKey(SCOPE), "sg-A");
    localStorage.setItem(getFieldStyleGuideKey({ ...SCOPE, environmentId: "staging" }), "sg-B");
    const { result, rerender } = renderHook(
      ({ scope }: { scope: FieldStyleGuideScope }) => useFieldStyleGuide(scope),
      { initialProps: { scope: SCOPE } },
    );
    expect(result.current.fieldStyleGuide).toBe("sg-A");
    rerender({ scope: { ...SCOPE, environmentId: "staging" } });
    expect(result.current.fieldStyleGuide).toBe("sg-B");
  });

  it("returns null when scope is missing fields", () => {
    const { result } = renderHook(() =>
      useFieldStyleGuide({
        spaceId: undefined,
        environmentId: undefined,
        contentTypeId: undefined,
        fieldId: undefined,
      }),
    );
    expect(result.current.fieldStyleGuide).toBeNull();
    act(() => {
      result.current.setFieldStyleGuide("sg-noop");
    });
    expect(result.current.fieldStyleGuide).toBeNull();
  });
});
