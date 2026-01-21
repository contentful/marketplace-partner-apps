import { describe, it, expect } from "vitest";

import { buildTargetState } from "../buildTargetState";
import { config } from "../../config";

describe("buildTargetState", () => {
  it("creates a valid target state object for selected content types", () => {
    const selectedContentTypes = ["article", "blogPost"];

    const result = buildTargetState(selectedContentTypes);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result).toHaveProperty("article");
    expect(result).toHaveProperty("blogPost");

    for (const key of selectedContentTypes) {
      expect(result[key]).toEqual({
        controls: [{ fieldId: config.editorField.id }],
      });
    }
  });
});
