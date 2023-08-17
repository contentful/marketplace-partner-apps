const envOr = (key: string, defaultValue: string) => process.env[key] ?? defaultValue;

export const config = {
  dynamo: {
    endpoint: envOr('DYNAMO_ENDPOINT', 'local-dynamo-endpoint'),
    timeout: 10000,
    tableName: envOr('DYNAMO_TABLE_NAME', 'dynamo-table-name'),
    encryptionSecret: envOr('DYNAMO_ENCRYPTION_SECRET', 'secret')
  },
  contentful: {
    signingSecret: envOr('CTFL_SIGNING_SECRET', 'shhhh'),
  },
  serverless: {
    pathPrefix: envOr('SERVERLESS_PATH_PREFIX', '/dev'),
  },
};

export type DynamoConfiguration = (typeof config)['dynamo'];
export type ContentfulConfiguration = (typeof config)['contentful'];
export type ServerlessConfiguration = (typeof config)['serverless'];
