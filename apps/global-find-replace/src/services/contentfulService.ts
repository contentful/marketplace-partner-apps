import { PageAppSDK } from '@contentful/app-sdk';
import { ContentType, Entry, MatchField, FieldDefinition, BuildMatchEntriesParams, SearchEntriesParams, ApplyResult, UpdateEntryParams } from '../types';
import { replaceFieldValueByType, isReferenceField } from '../utils/fieldProcessors';
import * as Sentry from '@sentry/react';
import { EntryProps } from 'contentful-management';

export class ContentfulService {
  constructor(private sdk: PageAppSDK) {}

  /**
   * Fetches all content types
   */
  async getContentTypes(): Promise<ContentType[]> {
    const response = await this.sdk.cma.contentType.getMany({});
    return response.items;
  }

  /**
   * Gets the display name for an entry
   */
  private getEntryDisplayName(entry: Entry, contentTypes: ContentType[], locale: string): string {
    const contentType = contentTypes.find((ct) => ct.sys.id === entry.sys.contentType.sys.id);
    const titleField = contentType?.displayField;

    if (titleField && entry.fields?.[titleField]?.[locale]) {
      return entry.fields[titleField][locale];
    }

    return entry.sys.id;
  }

  /**
   * Builds match entries for a given entry and field
   */
  private buildMatchEntries(params: BuildMatchEntriesParams): MatchField[] {
    const { entry, field, fieldName, fieldDef, contentTypes, locale, find, replace, caseSensitive = false } = params;

    const value = field[locale];

    const results = Array.isArray(value)
      ? value
          .map((val, i) => {
            const result = replaceFieldValueByType(val, fieldDef, find, replace, caseSensitive);
            return result ? { ...result, index: i } : null;
          })
          .filter(Boolean)
      : [replaceFieldValueByType(value, fieldDef, find, replace, caseSensitive)].filter(Boolean);

    // Filter out results where the final updated value is invalid for the field type
    const validResults = results.filter((r: any) => {
      return this.isValidValueForField(r.updated, fieldDef);
    });

    return validResults.map((r: any) => ({
      id: `${entry.sys.id}:${fieldName}${r.index !== undefined ? `:${r.index}` : ''}`,
      name: this.getEntryDisplayName(entry, contentTypes, locale),
      contentType: entry.sys.contentType.sys.id,
      entryId: entry.sys.id,
      field: fieldName,
      ...r,
    }));
  }

  /**
   * Validates if the updated value is valid for a specific field type
   */
  private isValidValueForField(finalValue: any, fieldDef: FieldDefinition): boolean {
    try {
      switch (fieldDef.type) {
        case 'Integer': {
          const intNum = Number(finalValue);
          return Number.isInteger(intNum);
        }
        case 'Number': {
          const num = Number(finalValue);
          return isFinite(num);
        }
        case 'Boolean':
          return typeof finalValue === 'boolean' || finalValue.toLowerCase() === 'true' || finalValue.toLowerCase() === 'false';

        case 'Date':
          if (typeof finalValue === 'string') {
            const date = new Date(finalValue);
            return !isNaN(date.getTime());
          }
          return false;

        case 'Object':
        case 'RichText':
          if (typeof finalValue === 'string') {
            try {
              JSON.parse(finalValue);
              return true;
            } catch {
              return false;
            }
          }
          return typeof finalValue === 'object';

        case 'Array':
          // For arrays, the finalValue should be the individual item being replaced
          if (fieldDef.items?.type === 'Integer') {
            const intNum = Number(finalValue);
            return Number.isInteger(intNum);
          }
          if (fieldDef.items?.type === 'Number') {
            const num = Number(finalValue);
            return isFinite(num);
          }
          if (fieldDef.items?.type === 'Boolean') {
            return typeof finalValue === 'boolean' || finalValue.toLowerCase() === 'true' || finalValue.toLowerCase() === 'false';
          }
          // For other array types, assume string is valid
          return true;

        case 'Text':
        case 'Symbol':
        case 'Location':
        default:
          return true;
      }
    } catch {
      // If validation throws an error, consider it invalid
      return false;
    }
  }

  /**
   * Searches for entries matching the find criteria
   */
  async searchEntries(params: SearchEntriesParams): Promise<MatchField[]> {
    const { contentTypeIds, contentTypes, locale, find, replace, caseSensitive = false, searchAllFields = false } = params;

    const allMatches: MatchField[] = [];

    for (const contentTypeId of contentTypeIds) {
      let skip = 0;
      let limit = 1000;
      let hasMore = true;

      const select = this.getSelectFields(contentTypes, contentTypeId);

      while (hasMore) {
        const query: any = { content_type: contentTypeId, limit, skip, select };
        if (!searchAllFields) {
          query.query = find;
        }

        try {
          const response = await this.sdk.cma.entry.getMany({
            query,
          });

          allMatches.push(...this.processEntries(response, contentTypes, locale, find, replace, caseSensitive));
          skip += limit;
          hasMore = response.items.length === limit;
        } catch (error: any) {
          if (error.message.includes('Response size too big') && limit > 75) {
            limit = limit / 2;
          } else {
            throw error;
          }
        }
      }
    }

    return allMatches;
  }

  private getSelectFields(contentTypes: ContentType[], contentTypeId: string): string {
    const select = ['sys'];

    const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
    if (!contentType) return select.join(',');

    const validFieldTypes = ['Integer', 'Number', 'Boolean', 'Date', 'Object', 'RichText', 'Text', 'Symbol', 'Location'];

    for (const field of contentType.fields) {
      if (validFieldTypes.includes(field.type) || (field.type === 'Array' && field.items?.linkType !== 'Asset' && field.items?.linkType !== 'Entry')) {
        select.push(`fields.${field.id}`);
      }
    }

    return select.join(',');
  }

  private processEntries(response: any, contentTypes: ContentType[], locale: string, find: string, replace: string, caseSensitive: boolean): MatchField[] {
    const results: MatchField[] = [];

    for (const entry of response.items) {
      for (const fieldName in entry.fields) {
        const fieldDef = contentTypes.find((ct) => ct.sys.id === entry.sys.contentType.sys.id)?.fields.find((f: FieldDefinition) => f.id === fieldName);

        if (!fieldDef || isReferenceField(fieldDef)) continue;
        const matches = this.buildMatchEntries({
          entry,
          field: entry.fields[fieldName],
          fieldName,
          fieldDef,
          contentTypes,
          locale,
          find,
          replace,
          caseSensitive,
        });

        if (caseSensitive) {
          // Filter matches that don't match case
          const caseSensitiveMatches = matches.filter((match) => {
            const val = match.original;
            if (typeof val !== 'string') return false;
            return val.includes(find); // This will do a case-sensitive match
          });
          results.push(...caseSensitiveMatches);
        } else {
          results.push(...matches);
        }
      }
    }

    return results;
  }

  /**
   * Casts a value to the correct type based on field definition
   */
  private castValue(raw: any, fieldDef: FieldDefinition): any {
    if (fieldDef.type === 'Integer' || fieldDef.type === 'Number') {
      return Number(raw);
    }

    if (fieldDef.type === 'Boolean') {
      return raw === 'true' || raw === true;
    }

    if (fieldDef.type === 'RichText' || fieldDef.type === 'Object') {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    return raw;
  }

  /**
   * Applies field updates to a single entry and publishes
   */
  async applyEntryUpdates(entryUpdates: MatchField[], contentTypes: ContentType[], locale: string, publishAfterUpdate: boolean): Promise<ApplyResult> {
    const entryId = entryUpdates[0].entryId;
    const fullEntry: EntryProps = await this.sdk.cma.entry.get({ entryId });
    let updatedEntry;

    try {
      updatedEntry = await this.updateEntry({ entryUpdates, contentTypes, fullEntry, locale, entryId });
    } catch (err: any) {
      Sentry.captureException(err);
      return {
        updateSuccess: false,
        publishSuccess: false,
        errorMessage: 'Update failed',
      };
    }

    if (publishAfterUpdate) {
      try {
        await this.sdk.cma.entry.publish({ entryId: updatedEntry.sys.id }, updatedEntry);
      } catch (err: any) {
        if (err?.message?.includes('notResolvable') || err?.message?.includes('UnresolvedLinks')) {
          return {
            updateSuccess: true,
            publishSuccess: false,
            errorMessage: 'Publish skipped due to unresolved links',
          };
        }
        Sentry.captureException(err);
        return {
          updateSuccess: true,
          publishSuccess: false,
          errorMessage: 'Publish failed',
        };
      }
    }

    return {
      updateSuccess: true,
      publishSuccess: publishAfterUpdate,
    };
  }

  private async updateEntry(request: UpdateEntryParams) {
    const { entryUpdates, contentTypes, fullEntry, locale, entryId } = request;

    for (const entryUpdate of entryUpdates) {
      const fieldDef = contentTypes
        .find((ct) => ct.sys.id === fullEntry.sys.contentType.sys.id)
        ?.fields.find((f: FieldDefinition) => f.id === entryUpdate.field);

      if (!fieldDef) {
        throw new Error(`Field definition not found for ${entryUpdate.field}`);
      }

      const valueToSet = this.castValue(entryUpdate.updated, fieldDef);

      if (entryUpdate.index !== undefined && Array.isArray(fullEntry.fields[entryUpdate.field][locale])) {
        fullEntry.fields[entryUpdate.field][locale][entryUpdate.index] = valueToSet;
      } else {
        fullEntry.fields[entryUpdate.field][locale] = valueToSet;
      }
    }

    return await this.sdk.cma.entry.update({ entryId }, fullEntry);
  }

  /**
   * Gets all available locales
   */
  getLocales(): string[] {
    return Object.keys(this.sdk.locales.names);
  }
}
