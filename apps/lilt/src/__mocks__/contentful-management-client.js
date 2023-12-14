import { createClient } from 'contentful-management';

/**
 * @typedef {import('contentful-management').CursorPaginatedCollectionProp} CursorPaginatedCollectionProp
 * @typedef {import('contentful-management').ReleaseProps} ReleaseProps
 * @typedef {import('contentful-management').EntryProps} EntryProps
 * @typedef {import('contentful-management').ContentTypeProps} ContentTypeProps
 */
class CMClient {
  client;

  /**
   *
   * @param {import('contentful-ui-extensions-sdk').KnownSDK} sdk
   */
  constructor(sdk) {
    const { cmaAdapter, ids } = sdk;
    const environmentId = ids.environment;
    const spaceId = ids.space;
    this.client = createClient(
      { apiAdapter: cmaAdapter },
      { type: 'plain', defaults: { environmentId, spaceId } }
    );
  }

  /**
   * Returns releases associated with an entry
   * @param {string} entryId
   * @returns {Promise<CursorPaginatedCollectionProp<ReleaseProps>>} releases query result
   */
  getReleasesByEntryId() {
    return Promise.resolve({
      items: []
    });
  }

  /**
   * Get entries by their IDs
   * @returns {Promise<EntryProps[]>} releases query result
   */
  getEntriesByIDs() {
    return Promise.resolve([]);
  }

  /**
   * Updates an entry
   * @returns {Promise<EntryProps>} releases query result
   */
  updateEntry() {
    return Promise.resolve({});
  }

  /**
   * Get content types by their IDs
   * @returns {Promise<EntryProps[]>} releases query result
   */
  async getContentTypesByIDs() {
    return Promise.resolve([]);
  }

  /**
   * Get content types by their IDs
   * @returns {Promise<EntryProps[]>} releases query result
   */
  async getEntryReferences() {
    return Promise.resolve({ includes: { Entry: [] } });
  }
}

export default CMClient;
