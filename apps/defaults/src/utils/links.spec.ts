import { describe, it, expect } from "vitest";
import { getFunctionLogsUrl, getContentTypeUrl } from "./links";
import { mockSdk } from "../../test/mocks";

const baseSdk: any = {
  ...mockSdk,
  ids: {
    ...mockSdk.ids,
    organization: "org123",
    space: "space789",
    environment: "master",
  },
};

describe("links utils", () => {
  it("builds function logs url with environment", () => {
    const url = getFunctionLogsUrl(baseSdk);
    expect(url).toBe(
      "https://app.contentful.com/account/organizations/org123/apps/definitions/test-app/functions/appeventHandler/logs?environmentId=master&spaceId=space789"
    );
  });

  it("builds function logs url using alias when available", () => {
    const sdk = {
      ...baseSdk,
      ids: { ...baseSdk.ids, environmentAlias: "preview" },
    };
    const url = getFunctionLogsUrl(sdk);
    expect(url.includes("environmentId=preview")).toBe(true);
  });

  it("builds content type url", () => {
    const url = getContentTypeUrl(baseSdk, "article");
    expect(url).toBe(
      "https://app.contentful.com/spaces/space789/environments/master/content_types/article"
    );
  });
});
