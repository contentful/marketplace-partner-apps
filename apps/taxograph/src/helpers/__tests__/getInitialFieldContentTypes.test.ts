import { describe, it, expect, vi } from "vitest";

import { getInitialFieldContentTypes } from "../getInitialFieldContentTypes";

describe("getInitialFieldContentTypes", () => {
  it("returns content type IDs that have the app widget configured", async () => {
    const APP_ID = "myAppId";

    const getManyMock = vi.fn().mockResolvedValue({
      items: [
        {
          sys: { contentType: { sys: { id: "article" } } },
          controls: [{ widgetId: APP_ID, widgetNamespace: "app" }],
        },
        {
          sys: { contentType: { sys: { id: "blogPost" } } },
          controls: [], // not configured for our app
        },
      ],
    });

    const cma = {
      editorInterface: {
        getMany: getManyMock,
      },
    } as any;

    const sdk = {
      ids: { space: "space123", environment: "master", app: APP_ID },
    } as any;

    const result = await getInitialFieldContentTypes(cma, sdk);

    expect(result).toEqual(["article"]);
    expect(getManyMock).toHaveBeenCalledTimes(1);
  });
});
