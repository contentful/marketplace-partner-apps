import { describe, it, expect, vi } from "vitest";
import { afterEach } from "vitest";
import { handler } from "./appeventHandler";

vi.mock("contentful-management", () => {
  return {
    createClient: vi.fn(() => mockClient),
  };
});

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockPublish = vi.fn();
const mockClient = {
  entry: {
    get: mockGet,
    update: mockUpdate,
    publish: mockPublish,
  },
};

function createBaseEvent() {
  return {
    headers: { "X-Contentful-Topic": "ContentManagement.Entry.create" },
    body: {
      sys: {
        id: "entry1",
        contentType: { sys: { id: "article" } },
        space: { sys: { id: "space" } },
      },
    },
  } as any;
}

function createContext(params: any) {
  return {
    spaceId: "space",
    environmentId: "master",
    cmaClientOptions: {
      accessToken: "x",
      environmentId: "master",
      spaceId: "space",
    },
    appInstallationParameters: params,
  } as any;
}

describe("appeventHandler", () => {
  afterEach(() => vi.clearAllMocks());

  it("sets current date default", async () => {
    const entryStub = { sys: {}, fields: {} };
    mockGet.mockResolvedValue(entryStub);
    mockUpdate.mockResolvedValue(entryStub);

    const params = {
      contentTypes: {
        article: {
          fields: [
            {
              fieldId: "publishDate",
              fieldType: "Date",
              defaultValue: { type: "current-date" },
            },
          ],
        },
      },
    };

    await handler(createBaseEvent(), createContext(params));

    expect(mockUpdate).toHaveBeenCalled();
    const updatedEntryArg = mockUpdate.mock.calls[0][1];
    expect(updatedEntryArg.fields.publishDate).toBeDefined();
  });

  it("sets asset array links default", async () => {
    const entryStub = { sys: {}, fields: {} };
    mockGet.mockResolvedValue(entryStub);
    mockUpdate.mockResolvedValue(entryStub);

    const params = {
      contentTypes: {
        article: {
          fields: [
            {
              fieldId: "gallery",
              fieldType: "AssetArray",
              linkType: "Asset",
              defaultValue: { type: "asset", value: ["a1", "a2"] },
            },
          ],
        },
      },
    };

    await handler(createBaseEvent(), createContext(params));

    expect(mockUpdate).toHaveBeenCalled();
    const updatedEntryArg = mockUpdate.mock.calls[0][1];
    expect(updatedEntryArg.fields.gallery["en-US"]).toHaveLength(2);
  });
});
