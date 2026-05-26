import { afterEach, describe, expect, it } from "vitest";
import {
  getFieldStyleGuide,
  getFieldStyleGuideKey,
  setFieldStyleGuide,
  type FieldStyleGuideScope,
} from "./fieldStyleGuide";

const SCOPE: FieldStyleGuideScope = {
  spaceId: "space-1",
  environmentId: "master",
  contentTypeId: "article",
  fieldId: "title",
};

describe("fieldStyleGuide", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when no value is stored", () => {
    expect(getFieldStyleGuide(SCOPE)).toBeNull();
  });

  it("round-trips a style guide id", () => {
    setFieldStyleGuide(SCOPE, "sg-123");
    expect(getFieldStyleGuide(SCOPE)).toBe("sg-123");
  });

  it("clears the value when given null", () => {
    setFieldStyleGuide(SCOPE, "sg-123");
    setFieldStyleGuide(SCOPE, null);
    expect(getFieldStyleGuide(SCOPE)).toBeNull();
    expect(localStorage.getItem(getFieldStyleGuideKey(SCOPE))).toBeNull();
  });

  it("treats empty string as a clear", () => {
    setFieldStyleGuide(SCOPE, "sg-123");
    setFieldStyleGuide(SCOPE, "");
    expect(getFieldStyleGuide(SCOPE)).toBeNull();
  });

  it("scopes values per (space, env, contentType, field) tuple", () => {
    setFieldStyleGuide(SCOPE, "sg-A");
    setFieldStyleGuide({ ...SCOPE, fieldId: "body" }, "sg-B");
    setFieldStyleGuide({ ...SCOPE, contentTypeId: "blogPost" }, "sg-C");
    setFieldStyleGuide({ ...SCOPE, spaceId: "space-2" }, "sg-D");
    setFieldStyleGuide({ ...SCOPE, environmentId: "staging" }, "sg-E");
    expect(getFieldStyleGuide(SCOPE)).toBe("sg-A");
    expect(getFieldStyleGuide({ ...SCOPE, fieldId: "body" })).toBe("sg-B");
    expect(getFieldStyleGuide({ ...SCOPE, contentTypeId: "blogPost" })).toBe("sg-C");
    expect(getFieldStyleGuide({ ...SCOPE, spaceId: "space-2" })).toBe("sg-D");
    expect(getFieldStyleGuide({ ...SCOPE, environmentId: "staging" })).toBe("sg-E");
  });

  it("ignores partial scopes with empty fields", () => {
    setFieldStyleGuide({ ...SCOPE, spaceId: "" }, "sg-X");
    setFieldStyleGuide({ ...SCOPE, environmentId: "" }, "sg-Y");
    setFieldStyleGuide({ ...SCOPE, contentTypeId: "" }, "sg-Z");
    setFieldStyleGuide({ ...SCOPE, fieldId: "" }, "sg-W");
    expect(getFieldStyleGuide({ ...SCOPE, spaceId: "" })).toBeNull();
    expect(getFieldStyleGuide({ ...SCOPE, environmentId: "" })).toBeNull();
    expect(getFieldStyleGuide({ ...SCOPE, contentTypeId: "" })).toBeNull();
    expect(getFieldStyleGuide({ ...SCOPE, fieldId: "" })).toBeNull();
  });
});
