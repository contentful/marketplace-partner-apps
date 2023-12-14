import { createClient } from 'contentful-management';

/**
 * @typedef {import('contentful-management').CursorPaginatedCollectionProp} CursorPaginatedCollectionProp
 * @typedef {import('contentful-management').ReleaseProps} ReleaseProps
 * @typedef {import('contentful-management').EntryProps} EntryProps
 * @typedef {import('contentful-management').ContentTypeProps} ContentTypeProps
 * @typedef {keyof import('contentful-management').PlainClientAPI} ResourceTypes
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
  getReleasesByEntryId(entryId) {
    return this.client.release.query({
      query: {
        'entities.sys.id[in]': entryId,
        'entities.sys.linkType': 'Entry'
      }
    });
  }

  /**
   * Get entries by their IDs
   * If the argument contains duplicate IDs, the query result will exclude them anyway
   * @param {string[]} ids IDs of the entries to fetch
   * @returns {Promise<EntryProps[]>} releases query result
   */
  getEntriesByIDs(ids) {
    return this.fetchPaginatedResources('entry', ids);
  }

  /**
   * Updates an entry
   * @param {EntryProps} entry
   * @returns {Promise<EntryProps>} releases query result
   */
  updateEntry(entry) {
    return this.client.entry.update({ entryId: entry.sys.id }, entry);
  }

  /**
   * Get content types by their IDs
   * If the argument contains duplicate IDs, the query result will exclude them anyway
   * @param {string[]} ids IDs of the content types to fetch
   * @returns {Promise<ContentTypeProps[]>} releases query result
   */
  getContentTypesByIDs(ids) {
    return this.fetchPaginatedResources('contentType', ids);
  }

  /**
   * fetches all resources by their IDs
   * by looping over all resource pages
   * with which the API responds
   * @param {ResourceTypes} resourceType
   * @returns {Function}
   */
  async fetchPaginatedResources(resourceType, ids) {
    const request = skip =>
      this.client[resourceType].getMany({
        query: { skip, limit: 100, 'sys.id[in]': ids.join(',') }
      });

    let resources = [];

    const { total, items } = await request(0);
    resources.push(...items);

    while (total > resources.length) {
      const { items: newItems } = await request(resources.length);
      resources.push(...newItems);
    }

    return resources;
  }

  async getEntryReferences(entryId) {
    return this.client.entry.references({ entryId, include: 10 });
  }

  async getLocales() {
    return this.client.locale.getMany();
  }
}

export default CMClient;
