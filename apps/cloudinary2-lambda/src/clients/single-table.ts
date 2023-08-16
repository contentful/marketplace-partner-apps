import { DynamoDB } from 'aws-sdk';
import { BackendParameters, Entity } from '../interfaces';

interface EntityTypeMap {
  [Entity.BackendParameters]: BackendParameters
}

type EntityType = keyof EntityTypeMap;

const POINTER_SEPARATOR = '/';
const VALID_POINTER_SEG_RE = /^[a-zA-Z0-9_-]{1,64}$/;

const makePointer = (segments: string[]): string => {
  segments.forEach((seg) => {
    if (!VALID_POINTER_SEG_RE.test(seg)) {
      throw new Error(`Invalid pointer segment: ${seg}. Should match ${VALID_POINTER_SEG_RE}.`);
    }
  });

  if (segments.length > 0) {
    return POINTER_SEPARATOR + segments.join(POINTER_SEPARATOR) + POINTER_SEPARATOR;
  } else {
    return POINTER_SEPARATOR;
  }
};

export class SingleTableClient {
  protected docClient: DynamoDB.DocumentClient;
  protected tableName: string;

  // TODO: handle logging
  constructor(tableName: string, docClient: DynamoDB.DocumentClient) {
    this.tableName = tableName;
    this.docClient = docClient;
  }

  public async put<T extends EntityType>(typ: T, uuid: string, container: string[], item: EntityTypeMap[T]): Promise<EntityTypeMap[T]> {
    const Item = {
      ...item,
      uuid,
      typ,
      container: makePointer(container),
    };

    await this.docClient.put({ TableName: this.tableName, Item }).promise();

    return Item as EntityTypeMap[T];
  }

  public async get<T extends EntityType>(typ: T, installationUuid: string): Promise<EntityTypeMap[T] | undefined> {
    const { Item } = await this.docClient
      .get({
        TableName: this.tableName,
        Key: { uuid: installationUuid, typ },
        ConsistentRead: true,
      })
      .promise();

    return Item as EntityTypeMap[T];
  }

  public async delete(typ: EntityType, uuid: string): Promise<void> {
    await this.docClient.delete({ TableName: this.tableName, Key: { uuid, typ } }).promise();
  }
}

export const makeSingleTableClient = (tableName: string, docClient: DynamoDB.DocumentClient) => new SingleTableClient(tableName, docClient);
