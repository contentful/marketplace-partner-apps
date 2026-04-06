import { describe, it, expect, vi } from "vitest";

import { updateSelectedContentTypes } from "../updateSelectedContentTypes";
import { config } from "../../config";

describe("updateSelectedContentTypes", () => {
  it("calls CMA update & publish with enriched content type", async () => {
    const updateMock = vi
      .fn()
      .mockResolvedValue({ sys: { id: "article" }, fields: [] });
    const publishMock = vi.fn().mockResolvedValue({});

    const client = {
      contentType: {
        update: updateMock,
        publish: publishMock,
      },
    } as any;

    const selectedContentTypes = ["article"];
    const selectedSchemas = ["schema1"];

    const contentTypeItem: any = {
      sys: { id: "article" },
      fields: [],
      metadata: {},
    };

    const sdk = {
      ids: { space: "space123", environment: "master", app: "myAppId" },
    } as any;

    // Act
    const promises = updateSelectedContentTypes({
      client,
      selectedContentTypes,
      selectedSchemas,
      contentTypes: [contentTypeItem],
      sdk,
    });

    await Promise.all(promises);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledTimes(1);

    const [, updatePayload] = updateMock.mock.calls[0];
    expect(
      updatePayload.fields.some((f: any) => f.id === config.editorField.id)
    ).toBe(true);
    expect(updatePayload.metadata.taxonomy[0].sys.id).toBe("schema1");
  });
});
