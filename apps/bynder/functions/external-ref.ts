import type { FunctionEventHandler as EventHandler } from "@contentful/node-apps-toolkit";
import { getAsset, getBynderAccessToken } from "./Utils/bynderUtils";
import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import { Asset, BynderFunctionEventContext } from "./types";

/*
 * We define our GraphQL schema for output here.
 */
const typeDefs = `
"""
Custom scalar type for DateTime values
"""
scalar DateTime

"""
Custom scalar type for JSON objects
"""
scalar JSON

"""
Represents media items associated with a Bynder asset, including different file formats and transformations
"""
type MediaItems {
  "Unique identifier for the media item"
  id: ID!
  "Original filename of the media item"
  fileName: String!
  "Date when the media item was created"
  dateCreated: DateTime!
  "File size of the media item in bytes"
  size: Int!
  "MIME type or format of the media item"
  type: String!
  "Version number of the media item"
  version: Int
  "Width of the media item in pixels (for images/videos)"
  width: Int
  "Height of the media item in pixels (for images/videos)"
  height: Int
  "Available thumbnail URLs and transformations for the media item"
  thumbnails: JSON
  "Whether the media item is currently active"
  active: Boolean
  "Focus point coordinates for cropping and transformations"
  focusPoint: JSON
}

"""
Represents a Bynder asset with all its metadata, properties, and associated media items
"""
type Asset {
  "Unique identifier for the Bynder asset"
  id: ID!
  "Display name of the asset"
  name: String!
  "File size of the original asset in bytes"
  fileSize: Int!
  "Asset type (image, video, document, audio)"
  type: String!
  "Description or caption for the asset"
  description: String
  "Hash identifier for the asset"
  idHash: String
  "Tags associated with the asset for categorization"
  tags: [String]
  "Webimage thumbnail URL of an asset"
  src: String
  "Width of the asset in pixels (for images/videos)"
  width: Int
  "Height of the asset in pixels (for images/videos)"
  height: Int
  "Whether the asset is archived"
  archive: Boolean
  "Brand identifier associated with the asset"
  brandId: String
  "Whether the asset has limited usage rights"
  limited: Boolean
  "Whether the asset is publicly accessible"
  isPublic: Boolean
  "URL to the original asset file"
  original: String
  "Copyright information for the asset"
  copyright: String
  "File extensions available for the asset"
  extension: [String]
  "Orientation of the asset (landscape, portrait, square)"
  orientation: String
  "Whether the asset has a watermark applied"
  watermarked: Boolean
  "Available thumbnail URLs and transformations"
  thumbnails: JSON
  "Preview URLs for video assets"
  videoPreviewURLs: [String]
  "Custom text metadata properties"
  textMetaproperties: [String]
  "User who created the asset"
  userCreated: String
  "Active focus point for the original asset"
  activeOriginalFocusPoint: JSON
  "Date when the asset was created"
  dateCreated: DateTime!
  "Date when the asset was last modified"
  dateModified: DateTime!
  "Date when the asset was published"
  datePublished: DateTime
  "Base URL for asset transformations"
  transformBaseUrl: String
  "Available property options for the asset"
  propertyOptions: [String]
  "Campaign property values"
  property_Campaign: [String]
  "File extension property values"
  property_File_extension: [String]
  "Department property values"
  property_Department: [String]
  "Industry property values"
  property_Industry: [String]
  "Language property values"
  property_Language: [String]
  "Usage rights property values"
  property_Usage_Rights: [String]
  "Asset type property values"
  property_Asset_Type: [String]
  "Asset subtype property values"
  property_Asset_SubType: [String]
  "Related assets linked to this asset"
  relatedAssets: [JSON]
  "Media items associated with this asset"
  mediaItems: [MediaItems]
}

"""
Root query type for accessing Bynder assets
"""
type Query {
  "Retrieve a Bynder asset by its original asset data"
  asset(
    "The original asset object containing the asset ID and metadata"
    originalAsset: JSON!
  ): Asset
}
`;

/**
 * Typed Schema for our custom GraphQL server with context.
 */
const schema = createSchema({
  typeDefs,
  resolvers: {
    JSON: JSONResolver,
    DateTime: DateTimeResolver,
    Query: {
      asset: async (
        _parent,
        { originalAsset },
        _context: BynderFunctionEventContext,
      ) => {
        const { bynderAccessToken } = _context;
        const { bynderURL, urlMetapropertyName } = _context.appInstallationParameters;
        const assetId = originalAsset.id ?? null;
        // Preliminary checks on the passed data.
        if (assetId === null) {
          throw new GraphQLError(
            `The Json field has a malformed asset. Please try to add an asset again`,
          );
        }
        if (!bynderURL || !bynderAccessToken) {
          throw new GraphQLError(
            `Bynder external references are not configured. Please set a valid Bynder URL, client ID, and client secret in the app config page.`,
          );
        }
        // Call the Bynder API and get the output.
        const response = await getAsset(
          bynderURL,
          _context.bynderAccessToken!,
          assetId,
        );
        if (response.status === 200) {
          return convertToGraphQLType(response.data, urlMetapropertyName);
        }
        if (response.status === 404) {
          throw new GraphQLError(
            `Asset not found on Bynder. Possibly it was deleted. Try to refresh the asset from the entry.`,
          );
        } else if (response.status === 401) {
          throw new GraphQLError(
            `Bad Request. Please set a valid Bynder client ID and secret on the app config page.`,
          );
        } else {
          throw new GraphQLError(
            `Bynder API returned a non-200 status code: Error code: ${response.status}`,
          );
        }
      },
    },
  },
});

/**
 * Convert API output to GraphQAL output.
 *
 * @param rawAsset
 *  Raw response of an asset received by API.
 * @returns Asset
 *  Transformed Asset.
 */
const convertToGraphQLType = (rawAsset: any, urlMetapropertyName?: string): Asset => {
  // Fetch the webimage
  const thumbnails =
    typeof rawAsset["thumbnails"] === "string"
      ? JSON.parse(rawAsset["thumbnails"])
      : (rawAsset["thumbnails"] ?? {});

  let original = rawAsset["original"];
  if (urlMetapropertyName && Array.isArray(rawAsset["textMetaproperties"])) {
    const metaprop = rawAsset["textMetaproperties"].find(
      (p: any) => typeof p === "object" && p.name === urlMetapropertyName,
    );
    if (metaprop?.value) {
      original = metaprop.value;
    }
  }

  // GraphQL schema doesn't accept hyphens (-), hence this basic transformation of this asset key.
  return {
    ...rawAsset,
    original,
    src: thumbnails["webimage"] ?? "",
    property_Asset_SubType: rawAsset["property_Asset_Sub-Type"] ?? null,
  };
};

// Create GraphQL Yoga server with introspection enabled for schema documentation
const yogaGraphQlServer = createYoga({
  schema,
  graphiql: false,
});

/**
 * Query Event handler to do the actual query to our custom GraphQL server.
 *
 * @param event
 * @param context
 * @returns
 */
const queryHandler: EventHandler<"graphql.query"> = async (
  event,
  context: BynderFunctionEventContext,
) => {
  const { query, operationName, variables } = event;

  // Fetch Bynder access token once per function request and add to context
  const { bynderURL, clientId, clientSecret } =
    context.appInstallationParameters || {};
  let bynderAccessToken: string = "";
  if (bynderURL && clientId && clientSecret) {
    try {
      bynderAccessToken = await getBynderAccessToken({
        bynderURL,
        clientId,
        clientSecret,
      });
    } catch (err) {
      // Optionally log or handle token fetch error
      bynderAccessToken = "";
    }
  }
  // Attach token to context for use in resolvers
  const extendedContext = { ...context, bynderAccessToken };

  const body = JSON.stringify({
    query,
    operationName,
    variables,
  });
  const request = {
    body,
    method: "post",
    headers: {
      accept: "application/graphql-response+json",
      "content-type": "application/json",
    },
  };
  // Call our custom graphQL server (URL doesn't matter) and wrap the output with GraphQL.
  const response = await yogaGraphQlServer.fetch(
    "http://bynderPlugin.com/graphql",
    request,
    extendedContext,
  );
  if (response.type !== "default") {
    throw new GraphQLError("Unsupported GraphQL result type");
  }
  return response.json();
};

/**
 * Field mapping handler to return a typed schema for the bynder field.
 *
 * @param event
 * @param context
 * @returns
 */
const fieldMappingHandler: EventHandler<"graphql.field.mapping"> = (
  event,
  context,
) => {
  // Define the field mapping to map the external api to
  // the field in the content type
  const fields = event.fields.map(({ contentTypeId, field }) => ({
    contentTypeId,
    fieldId: field.id,
    graphQLQueryField: "asset",
    graphQLOutputType: "[Asset]",
    graphQLQueryArguments: { originalAsset: "" },
  }));

  // Return the mapping and the namespace.
  // The namespace is used to namespace the
  // GraphQL types from the third party API.
  return {
    namespace: "Bynder",
    fields,
  };
};

/**
 * Event handler to assign handlers on GraphQL Events.
 *
 * @param event
 * @param context
 * @returns
 */
export const handler: EventHandler = (event, context) => {
  if (event.type === "graphql.field.mapping") {
    return fieldMappingHandler(event, context);
  }
  if (event.type === "graphql.query") {
    return queryHandler(event, context);
  }
  throw new GraphQLError("Unknown Event");
};
