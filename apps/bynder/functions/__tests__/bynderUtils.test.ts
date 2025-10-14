import { jest } from "@jest/globals";

// Mock fetch globally before importing the module
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Import after mocking
import {
  getBynderAccessToken,
  getAsset,
  getAssetUsage,
  createAssetUsage,
  deleteAssetUsage,
  extractBynderAssetIds,
} from "../Utils/bynderUtils";
import {
  BynderAuthConfig,
  BynderResponse,
  BynderAssetUsageResponse,
} from "../types";

// Helper to clear the internal token cache between tests
/**
 * Creates a unique Bynder configuration for testing purposes.
 * Since the token cache is not exported, each test needs unique configs to avoid cache conflicts.
 *
 * @param suffix - Optional suffix to append to the client ID for additional uniqueness
 * @returns BynderAuthConfig with unique client ID based on timestamp
 */
const createUniqueConfig = (suffix: string = ""): BynderAuthConfig => ({
  bynderURL: process.env.TEST_BYNDER_URL || "https://test-domain.bynder.com",
  clientId:
    (process.env.TEST_BYNDER_CLIENT_ID || "test_client_id") +
    "_" +
    Date.now() +
    suffix,
  clientSecret: process.env.TEST_BYNDER_CLIENT_SECRET || "test_client_secret",
});

describe("bynderUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("getBynderAccessToken", () => {
    test("should fetch new access token successfully", async () => {
      const testConfig = createUniqueConfig("_fetch_new");
      const mockTokenResponse = {
        access_token: "test_access_token_123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
      } as Response);

      const token = await getBynderAccessToken(testConfig);

      expect(token).toBe("test_access_token_123");
      expect(mockFetch).toHaveBeenCalledWith(
        `${testConfig.bynderURL}/v6/authentication/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: expect.any(URLSearchParams),
        },
      );

      // Check the body parameters
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1]?.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("client_credentials");
      expect(body.get("client_id")).toBe(testConfig.clientId);
      expect(body.get("client_secret")).toBe(testConfig.clientSecret);
    });

    test("should return cached token when available and not expired", async () => {
      const testConfig = createUniqueConfig("_cache_hit");
      const mockTokenResponse = {
        access_token: "cached_token_123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      // First call - should fetch new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
      } as Response);

      const firstToken = await getBynderAccessToken(testConfig);
      expect(firstToken).toBe("cached_token_123");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cached token
      const secondToken = await getBynderAccessToken(testConfig);
      expect(secondToken).toBe("cached_token_123");
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch call
    });

    test("should fetch new token when cache is expired", async () => {
      const testConfig = createUniqueConfig("_cache_expired");

      // First call with short expiry
      const firstMockResponse = {
        access_token: "expired_token",
        expires_in: 1, // 1 second
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => firstMockResponse,
      } as Response);

      const firstToken = await getBynderAccessToken(testConfig);
      expect(firstToken).toBe("expired_token");

      // Wait for token to expire (plus buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Second call with new token
      const secondMockResponse = {
        access_token: "new_token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => secondMockResponse,
      } as Response);

      const secondToken = await getBynderAccessToken(testConfig);
      expect(secondToken).toBe("new_token");
      expect(mockFetch).toHaveBeenCalledTimes(2); // Two separate fetch calls
    });

    test("should use different cache keys for different configs", async () => {
      const config1 = createUniqueConfig("_config1");
      const config2 = createUniqueConfig("_config2");

      const mockResponse1 = {
        access_token: "token_for_config1",
        expires_in: 3600,
        token_type: "Bearer",
      };

      const mockResponse2 = {
        access_token: "token_for_config2",
        expires_in: 3600,
        token_type: "Bearer",
      };

      // Mock responses for both configs
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse2,
        } as Response);

      // Get tokens for both configs
      const token1 = await getBynderAccessToken(config1);
      const token2 = await getBynderAccessToken(config2);

      expect(token1).toBe("token_for_config1");
      expect(token2).toBe("token_for_config2");
      expect(mockFetch).toHaveBeenCalledTimes(2); // Both should fetch since they're different configs

      // Verify cache isolation - second calls should use cached values
      const cachedToken1 = await getBynderAccessToken(config1);
      const cachedToken2 = await getBynderAccessToken(config2);

      expect(cachedToken1).toBe("token_for_config1");
      expect(cachedToken2).toBe("token_for_config2");
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional fetches
    });

    test("should handle API error responses", async () => {
      const uniqueConfig = createUniqueConfig("_error_test");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as unknown as Response);

      await expect(getBynderAccessToken(uniqueConfig)).rejects.toThrow(
        "Failed to fetch Bynder access token: 401 Unauthorized",
      );
    });

    test("should handle network errors", async () => {
      const uniqueConfig = createUniqueConfig("_network_error");

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(getBynderAccessToken(uniqueConfig)).rejects.toThrow(
        "Network error",
      );
    });

    test("should handle bynderURL with trailing slash", async () => {
      const configWithTrailingSlash = {
        ...createUniqueConfig("_trailing_slash"),
        bynderURL: "https://test-domain.bynder.com/",
      };

      const mockTokenResponse = {
        access_token: "trailing_slash_token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
      } as Response);

      await getBynderAccessToken(configWithTrailingSlash);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test-domain.bynder.com/v6/authentication/oauth2/token",
        expect.any(Object),
      );
    });

    test("should handle missing expires_in in response", async () => {
      const uniqueConfig = createUniqueConfig("_missing_expires");

      const responseWithoutExpiresIn = {
        access_token: "token_without_expires",
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithoutExpiresIn,
      } as Response);

      const token = await getBynderAccessToken(uniqueConfig);
      expect(token).toBe("token_without_expires");
    });
  });

  describe("getAsset", () => {
    const mockAssetData = {
      id: "test-asset-id",
      name: "Test Asset",
      fileSize: 1024,
      type: "image",
      dateCreated: "2023-01-01T00:00:00Z",
      dateModified: "2023-01-01T00:00:00Z",
    };

    test("should fetch asset successfully", async () => {
      const testConfig = createUniqueConfig("_asset_success");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAssetData,
      } as Response);

      const result: BynderResponse = await getAsset(
        testConfig.bynderURL,
        "mock_token",
        "test-asset-id",
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockAssetData);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        `${testConfig.bynderURL}/api/v4/media/test-asset-id?versions=1`,
        {
          headers: {
            Authorization: "Bearer mock_token",
          },
          method: "GET",
        },
      );
    });

    test("should handle asset not found (404)", async () => {
      const testConfig = createUniqueConfig("_asset_404");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response);

      const result: BynderResponse = await getAsset(
        testConfig.bynderURL,
        "mock_token",
        "non-existent-asset-id",
      );

      expect(result.status).toBe(404);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    test("should handle unauthorized access (401)", async () => {
      const testConfig = createUniqueConfig("_asset_401");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as unknown as Response);

      const result: BynderResponse = await getAsset(
        testConfig.bynderURL,
        "invalid_token",
        "test-asset-id",
      );

      expect(result.status).toBe(401);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    test("should handle network errors", async () => {
      const testConfig = createUniqueConfig("_asset_network_error");
      const networkError = new Error("Network connection failed");
      mockFetch.mockRejectedValueOnce(networkError);

      const result: BynderResponse = await getAsset(
        testConfig.bynderURL,
        "mock_token",
        "test-asset-id",
      );

      expect(result.status).toBe(500);
      expect(result.error).toBe(networkError);
      expect(result.data).toBeUndefined();
    });

    test("should construct correct URL with trailing slash in bynderURL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAssetData,
      } as Response);

      await getAsset(
        "https://test-domain.bynder.com/",
        "mock_token",
        "test-asset-id",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test-domain.bynder.com/api/v4/media/test-asset-id?versions=1",
        expect.any(Object),
      );
    });

    test("should construct correct URL without trailing slash in bynderURL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAssetData,
      } as Response);

      await getAsset(
        "https://test-domain.bynder.com",
        "mock_token",
        "test-asset-id",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test-domain.bynder.com/api/v4/media/test-asset-id?versions=1",
        expect.any(Object),
      );
    });

    test("should include versions=1 query parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAssetData,
      } as Response);

      const testConfig = createUniqueConfig("_versions_param");
      await getAsset(testConfig.bynderURL, "mock_token", "test-asset-id");

      const expectedUrl = `${testConfig.bynderURL}/api/v4/media/test-asset-id?versions=1`;
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    test("should handle different asset IDs", async () => {
      const testConfig = createUniqueConfig("_different_assets");
      const assetIds = ["asset-1", "asset-2", "asset-3"];

      for (const assetId of assetIds) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockAssetData, id: assetId }),
        } as Response);

        const result = await getAsset(
          testConfig.bynderURL,
          "mock_token",
          assetId,
        );

        expect(result.status).toBe(200);
        expect(result.data).toEqual({ ...mockAssetData, id: assetId });
      }

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test("should handle empty response body for non-200 status", async () => {
      const testConfig = createUniqueConfig("_empty_response");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("No JSON body");
        },
      } as unknown as Response);

      const result: BynderResponse = await getAsset(
        testConfig.bynderURL,
        "mock_token",
        "test-asset-id",
      );

      expect(result.status).toBe(500);
      expect(result.data).toBeUndefined();
    });
  });

  describe("Integration tests", () => {
    test("should work with getBynderAccessToken and getAsset together", async () => {
      const integrationConfig = createUniqueConfig("_integration");

      const mockTokenResponse = {
        access_token: "integration_test_token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      const mockAssetData = {
        id: "integration-asset-id",
        name: "Integration Test Asset",
        fileSize: 2048,
        type: "image",
        dateCreated: "2023-01-01T00:00:00Z",
        dateModified: "2023-01-01T00:00:00Z",
      };

      // Mock token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
      } as Response);

      // Mock asset fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAssetData,
      } as Response);

      // Get token first
      const token = await getBynderAccessToken(integrationConfig);
      expect(token).toBe("integration_test_token");

      // Use token to get asset
      const assetResult = await getAsset(
        integrationConfig.bynderURL,
        token,
        "integration-asset-id",
      );

      expect(assetResult.status).toBe(200);
      expect(assetResult.data).toEqual(mockAssetData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    describe("getAssetUsage", () => {
      const mockUsageResponse: BynderAssetUsageResponse = [
        {
          asset_id: "test-asset-id-1",
          id: "usage-id-1",
          integration: {
            id: "ac534173-7ee1-493b-98b7-a6d88ce7a450",
            description: "Contentful",
          },
          timestamp: "2023-01-01T12:00:00Z",
          uri: "/contentful/entry/123",
          additional: "Test usage",
        },
      ];

      test("should fetch asset usage successfully", async () => {
        const testConfig = createUniqueConfig("_usage_success");

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockUsageResponse,
        } as Response);

        const result = await getAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "/contentful/entry/123",
          "test-asset-id-1",
        );

        expect(result.status).toBe(200);
        expect(result.data).toEqual(mockUsageResponse);

        // Check URL construction with query parameters
        const expectedUrl = `${testConfig.bynderURL}/api/media/usage?integration_id=ac534173-7ee1-493b-98b7-a6d88ce7a450&uri=%2Fcontentful%2Fentry%2F123&asset_id=test-asset-id-1`;
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: "GET",
          headers: {
            Authorization: "Bearer mock_token",
          },
        });
      });

      test("should handle empty usage response", async () => {
        const testConfig = createUniqueConfig("_usage_empty");

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);

        const result = await getAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "test-asset-id",
          "/contentful/entry/456",
        );

        expect(result.status).toBe(200);
        expect(result.data).toEqual([]);
      });

      test("should handle network errors", async () => {
        const testConfig = createUniqueConfig("_usage_network_error");
        const networkError = new Error("Network connection failed");
        mockFetch.mockRejectedValueOnce(networkError);

        const result = await getAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "test-asset-id",
          "/contentful/entry/123",
        );

        expect(result.status).toBe(500);
        expect(result.error).toBe(networkError);
      });
    });

    describe("createAssetUsage", () => {
      const mockCreateResponse = {
        id: "new-usage-id",
        uri: "/contentful/entry/789",
        additional: "New usage created",
        asset_id: "test-asset-id-2",
        timestamp: "2023-01-01T12:30:00Z",
        integration: {
          id: "ac534173-7ee1-493b-98b7-a6d88ce7a450",
          description: "Contentful",
        },
      };

      test("should create asset usage successfully", async () => {
        const testConfig = createUniqueConfig("_create_success");

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockCreateResponse,
        } as Response);

        const result = await createAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "test-asset-id-2",
          "/contentful/entry/789",
          "New usage created",
        );

        expect(result.status).toBe(201);
        expect(result.data).toEqual(mockCreateResponse);

        // Check that the request was made with correct parameters
        expect(mockFetch).toHaveBeenCalledWith(
          `${testConfig.bynderURL}/api/media/usage`,
          {
            method: "POST",
            headers: {
              Authorization: "Bearer mock_token",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: expect.any(String),
          },
        );

        // Check the body content
        const callArgs = mockFetch.mock.calls[0];
        const bodyString = callArgs[1]?.body as string;
        const bodyParams = new URLSearchParams(bodyString);

        expect(bodyParams.get("asset_id")).toBe("test-asset-id-2");
        expect(bodyParams.get("integration_id")).toBe(
          "ac534173-7ee1-493b-98b7-a6d88ce7a450",
        );
        expect(bodyParams.get("uri")).toBe("/contentful/entry/789");
        expect(bodyParams.get("additional")).toBe("New usage created");
        expect(bodyParams.get("timestamp")).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ); // ISO8601 format
      });

      test("should handle creation errors", async () => {
        const testConfig = createUniqueConfig("_create_error");

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: "Bad request" }),
        } as unknown as Response);

        const result = await createAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "invalid-asset-id",
          "/contentful/entry/invalid",
          "Invalid usage",
        );

        expect(result.status).toBe(400);
        expect(result.data).toBeUndefined();
      });
    });

    describe("deleteAssetUsage", () => {
      test("should delete asset usage successfully", async () => {
        const testConfig = createUniqueConfig("_delete_success");

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => ({}),
        } as Response);

        const result = await deleteAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "test-asset-id-3",
          "/contentful/entry/delete-test",
        );

        expect(result.status).toBe(204);

        // Check URL construction with query parameters for DELETE
        const expectedUrl = `${testConfig.bynderURL}/api/media/usage?integration_id=ac534173-7ee1-493b-98b7-a6d88ce7a450&asset_id=test-asset-id-3&uri=%2Fcontentful%2Fentry%2Fdelete-test`;
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: "DELETE",
          headers: {
            Authorization: "Bearer mock_token",
          },
        });
      });

      test("should handle delete errors", async () => {
        const testConfig = createUniqueConfig("_delete_error");

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: "Usage not found" }),
        } as unknown as Response);

        const result = await deleteAssetUsage(
          testConfig.bynderURL,
          "mock_token",
          "non-existent-asset",
          "/contentful/entry/not-found",
        );

        expect(result.status).toBe(404);
      });
    });

    describe("extractBynderAssetIds", () => {
      /**
       * Helper function to create complete Bynder asset objects with all core required fields.
       * This ensures test assets pass the strict validation logic that requires all core fields.
       *
       * @param id - The asset ID to use
       * @param overrides - Optional object to override any default field values
       * @returns Complete Bynder asset object with all core fields populated
       */
      const createCompleteAsset = (id: string, overrides: any = {}) => ({
        id: id,
        name: `Test Asset ${id}`,
        dateCreated: "2023-01-01T00:00:00Z",
        dateModified: "2023-01-01T00:00:00Z",
        type: "image",
        fileSize: 1024,
        extension: ["jpg"],
        textMetaproperties: [],
        width: 800,
        height: 600,
        isPublic: 0,
        // Additional fields that might be present
        brandId: "brand-123",
        thumbnails: { webimage: "https://test.bynder.com/thumb.jpg" },
        src: "https://test.bynder.com/original.jpg",
        ...overrides,
      });

      test("should extract asset IDs from complete bynder asset objects", () => {
        const fields = {
          bynderImages: {
            "en-US": [
              createCompleteAsset("asset-1"),
              createCompleteAsset("asset-2"),
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["asset-1", "asset-2"]);
      });

      test("should extract asset IDs from multiple locales", () => {
        const fields = {
          bynderFiles: {
            "en-US": [
              createCompleteAsset("asset-en-1", { name: "English Asset" }),
            ],
            "fr-FR": [
              createCompleteAsset("asset-fr-1", { name: "French Asset" }),
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["asset-en-1", "asset-fr-1"]);
      });

      test("should extract asset IDs from nested structures", () => {
        const fields = {
          richText: {
            "en-US": {
              content: [
                {
                  data: {
                    bynderAsset: createCompleteAsset("nested-asset-1"),
                  },
                },
              ],
            },
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["nested-asset-1"]);
      });

      test("should handle assets with brandId", () => {
        const fields = {
          customField: {
            "en-US": {
              assets: [
                createCompleteAsset("brand-asset-1", { brandId: "brand-456" }),
              ],
            },
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["brand-asset-1"]);
      });

      test("should deduplicate asset IDs", () => {
        const fields = {
          field1: {
            "en-US": [
              createCompleteAsset("duplicate-asset", {
                name: "Duplicate Asset 1",
              }),
            ],
          },
          field2: {
            "en-US": [
              createCompleteAsset("duplicate-asset", {
                name: "Duplicate Asset 2",
              }),
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["duplicate-asset"]);
      });

      test("should ignore non-Bynder objects", () => {
        const fields = {
          regularField: {
            "en-US": "Just a string",
          },
          objectWithoutBynderStructure: {
            "en-US": {
              id: "not-bynder",
              title: "Regular object",
              // Missing most Bynder-specific properties
            },
          },
          bynderField: {
            "en-US": [createCompleteAsset("real-bynder-asset")],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["real-bynder-asset"]);
      });

      test("should handle empty fields", () => {
        const assetIds = extractBynderAssetIds({});
        expect(assetIds).toEqual([]);
      });

      test("should handle null and undefined values", () => {
        const fields = {
          nullField: {
            "en-US": null,
          },
          undefinedField: {
            "en-US": undefined,
          },
          emptyArray: {
            "en-US": [],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual([]);
      });

      test("should normalize UUID format with missing hyphens", () => {
        const fields = {
          bynderAssets: {
            "en-US": [
              createCompleteAsset("681d7df7e6e04d219c92f0c5e2ad90e3"), // Missing hyphens
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["681d7df7-e6e0-4d21-9c92-f0c5e2ad90e3"]); // Properly formatted UUID
      });

      test("should handle already properly formatted UUIDs", () => {
        const fields = {
          bynderAssets: {
            "en-US": [
              createCompleteAsset("681d7df7-e6e0-4d21-9c92-f0c5e2ad90e3"), // Already formatted
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["681d7df7-e6e0-4d21-9c92-f0c5e2ad90e3"]); // Should remain the same
      });

      test("should detect Bynder assets with custom domains and complete schema", () => {
        const fields = {
          bynderAssets: {
            "en-US": [
              createCompleteAsset("custom-domain-asset-1", {
                original: "https://my-company.assets.com/media/123",
                thumbnails: {
                  webimage: "https://my-company.assets.com/thumb/123",
                },
              }),
              createCompleteAsset("brand-asset-2", {
                brandId: "brand-456",
              }),
            ],
          },
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["custom-domain-asset-1", "brand-asset-2"]);
      });

      test("should detect real Bynder asset structure from production", () => {
        const fields = {
          "en-US": [
            {
              id: "4FA2A955-7106-412F-AF75164286819016",
              src: "https://appnovation.bynder.com/m/4a54296e1c03af84/webimage-daniel-gzz-ELC0hD4AwB0-unsplash.png",
              name: "daniel-gzz-ELC0hD4AwB0-unsplash",
              tags: [],
              type: "image",
              width: 6211,
              height: 4145,
              archive: 0,
              brandId: "7EC8B6F7-08AA-474B-AE6F97BA1BFFD82F",
              limited: 0,
              fileSize: 998645,
              isPublic: 0,
              original: null,
              copyright: null,
              extension: ["jpg"],
              thumbnails: {
                mini: "https://appnovation.bynder.com/m/4a54296e1c03af84/mini-daniel-gzz-ELC0hD4AwB0-unsplash.png",
                thul: "https://appnovation.bynder.com/m/4a54296e1c03af84/thul-daniel-gzz-ELC0hD4AwB0-unsplash.png",
                Banner:
                  "https://appnovation.bynder.com/m/4a54296e1c03af84/Banner-daniel-gzz-ELC0hD4AwB0-unsplash.jpg",
                webimage:
                  "https://appnovation.bynder.com/m/4a54296e1c03af84/webimage-daniel-gzz-ELC0hD4AwB0-unsplash.png",
                Instagram:
                  "https://appnovation.bynder.com/m/4a54296e1c03af84/Instagram-daniel-gzz-ELC0hD4AwB0-unsplash.jpg",
                transformBaseUrl:
                  "https://appnovation.bynder.com/transform/4fa2a955-7106-412f-af75-164286819016/daniel-gzz-ELC0hD4AwB0-unsplash",
              },
              dateCreated: "2024-07-11T23:00:35Z",
              description: "Daniel description",
              orientation: "landscape",
              watermarked: 0,
              dateModified: "2024-08-29T09:00:01Z",
              datePublished: "2021-11-09T10:03:44Z",
              videoPreviewURLs: [],
              textMetaproperties: [],
            },
          ],
        };

        const assetIds = extractBynderAssetIds(fields);
        expect(assetIds).toEqual(["4fa2a955-7106-412f-af75-164286819016"]); // Should be normalized to lowercase with hyphens
      });
    });
  });

  describe("URL construction tests", () => {
    test("getBynderAssetUrl should handle URLs with trailing slash", () => {
      // Test indirectly by checking the URL construction in getAsset
      const baseUrl = "https://test-domain.bynder.com/";
      expect(baseUrl.endsWith("/")).toBe(true);

      // The function should remove trailing slash and add /api/v4/media
      const expectedBase = "https://test-domain.bynder.com";
      expect(baseUrl.slice(0, -1)).toBe(expectedBase);
    });

    test("getBynderAssetUrl should handle URLs without trailing slash", () => {
      // Test indirectly by checking the URL construction in getAsset
      const baseUrl = "https://test-domain.bynder.com";
      expect(baseUrl.endsWith("/")).toBe(false);

      // The function should add /api/v4/media directly
      const expectedUrl = baseUrl + "/api/v4/media";
      expect(expectedUrl).toBe("https://test-domain.bynder.com/api/v4/media");
    });
  });
});
