import { ConfigAppSDK } from '@contentful/app-sdk';

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const DefaultWidgetId = 'objectEditor';

// Batch configuration for API requests
const BATCH_SIZE = 10; // Process editor interfaces in batches of 10
const RETRY_DELAY = 500; // Base delay for retries (ms)
const MAX_RETRIES = 3; // More retries with better backoff
const OVERALL_TIMEOUT = 60000; // 60 second timeout for large content models
const BATCH_DELAY = 200; // Delay between batches to avoid rate limits
const MAX_CONTENT_TYPES_TO_PROCESS = 1000; // Support large content models
const INITIAL_BATCH_SIZE = 1000; // Load all content types on initial load
const SEARCH_BATCH_SIZE = 25; // Load additional content types when searching

interface Control {
  fieldId: string;
  widgetId?: string;
  widgetNamespace?: string;
}

export interface JsonField {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isEnabled: boolean;
  originalEnabled: boolean;
}

export interface JsonFieldsResult {
  fields: JsonField[];
  totalContentTypes: number;
  processedContentTypes: number;
  hasMore: boolean;
}

interface ContentTypeWithJsonFields {
  contentType: any;
  jsonFields: any[];
}

// Helper function to sleep/delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES, delay: number = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('rate limit') || error.message?.includes('429'))) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

// Process editor interfaces in batches to avoid rate limiting
async function fetchEditorInterfacesBatch(
  cma: ConfigAppSDK['cma'],
  contentTypesWithJson: ContentTypeWithJsonFields[],
  onProgress?: (processed: number, total: number) => void
): Promise<Array<{ contentType: any; editorInterface: any; jsonFields: any[] }>> {
  const results: Array<{ contentType: any; editorInterface: any; jsonFields: any[] }> = [];

  // Process in batches
  for (let i = 0; i < contentTypesWithJson.length; i += BATCH_SIZE) {
    const batch = contentTypesWithJson.slice(i, i + BATCH_SIZE);

    // Fetch editor interfaces for this batch in parallel
    const batchPromises = batch.map(({ contentType, jsonFields }) =>
      retryWithBackoff(() => cma.editorInterface.get({ contentTypeId: contentType.sys.id }))
        .then((editorInterface) => ({
          contentType,
          editorInterface,
          jsonFields,
        }))
        .catch((error) => {
          console.error(`Failed to fetch editor interface for ${contentType.name}:`, error.message);
          // Return a fallback result so we don't fail completely
          return {
            contentType,
            editorInterface: { controls: [] },
            jsonFields,
          };
        })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      const processed = Math.min(i + BATCH_SIZE, contentTypesWithJson.length);
      onProgress(processed, contentTypesWithJson.length);
    }

    // Add a delay between batches to avoid rate limits
    if (i + BATCH_SIZE < contentTypesWithJson.length) {
      await sleep(BATCH_DELAY);
    }
  }

  return results;
}

// Add timeout wrapper for the entire operation
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs))]);
};

export async function getContentTypesWithJsonFieldsCount(cma: ConfigAppSDK['cma']): Promise<number> {
  try {
    // Fetch ALL content types (lightweight, no editor interfaces)
    const contentTypes = await cma.contentType.getMany({
      query: { limit: 1000 },
    });

    // Count content types that have JSON Object fields
    let count = 0;
    for (const contentType of contentTypes.items) {
      const hasJsonFields = contentType.fields.some((f) => f.type === JsonFieldType);
      if (hasJsonFields) {
        count++;
      }
    }

    return count;
  } catch (error: any) {
    console.error('getContentTypesWithJsonFieldsCount failed:', error.message);
    return 0;
  }
}

export async function getAllContentTypesWithJsonFields(cma: ConfigAppSDK['cma']): Promise<JsonField[]> {
  try {
    // Fetch ALL content types (lightweight, no editor interfaces)
    const contentTypes = await cma.contentType.getMany({
      query: { limit: 1000 },
    });

    // Filter and map to JSON fields (no editor interface calls)
    const jsonFields: JsonField[] = [];

    for (const contentType of contentTypes.items) {
      const contentTypeJsonFields = contentType.fields.filter((f) => f.type === JsonFieldType);

      for (const jsonField of contentTypeJsonFields) {
        jsonFields.push({
          contentTypeId: contentType.sys.id,
          contentTypeName: contentType.name,
          fieldId: jsonField.id,
          fieldName: jsonField.name,
          isEnabled: false, // We'll determine this lazily
          originalEnabled: false,
        });
      }
    }

    // Sort alphabetically for better UX
    return jsonFields.sort((a, b) => {
      const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
      return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
    });
  } catch (error: any) {
    console.error('getAllContentTypesWithJsonFields failed:', error.message);
    return [];
  }
}

export async function updateFieldEnabledStates(cma: ConfigAppSDK['cma'], appDefinitionId: string, fields: JsonField[]): Promise<JsonField[]> {
  try {
    // Group fields by content type to minimize API calls
    const fieldsByContentType = groupFieldsByContentType(fields);
    const updatedFields: JsonField[] = [];

    // Fetch editor interfaces for each content type
    const promises = Object.entries(fieldsByContentType).map(async ([contentTypeId, contentTypeFields]) => {
      try {
        const editorInterface = await cma.editorInterface.get({ contentTypeId });

        return contentTypeFields.map((field) => {
          const control = editorInterface.controls?.find((w: Control) => w.fieldId === field.fieldId);
          const isUsingApp = !!control && control.widgetId === appDefinitionId;

          return {
            ...field,
            isEnabled: isUsingApp,
            originalEnabled: isUsingApp,
          };
        });
      } catch (error) {
        console.error(`Failed to fetch editor interface for ${contentTypeId}:`, error);
        // Return fields with default state if we can't fetch the editor interface
        return contentTypeFields.map((field) => ({
          ...field,
          isEnabled: false,
          originalEnabled: false,
        }));
      }
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => {
      const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
      return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
    });
  } catch (error: any) {
    console.error('updateFieldEnabledStates failed:', error.message);
    return fields; // Return original fields if update fails
  }
}

export async function getJsonFields(
  cma: ConfigAppSDK['cma'],
  appDefinitionId: string,
  options?: { limit?: number; offset?: number },
  onProgress?: (processed: number, total: number) => void
): Promise<JsonFieldsResult> {
  try {
    const result = await withTimeout(getJsonFieldsInternal(cma, appDefinitionId, options, onProgress), OVERALL_TIMEOUT);
    return result;
  } catch (error: any) {
    console.error('getJsonFields failed:', error.message);
    // Return empty result to allow app to load in degraded mode
    return {
      fields: [],
      totalContentTypes: 0,
      processedContentTypes: 0,
      hasMore: false,
    };
  }
}

async function getJsonFieldsInternal(
  cma: ConfigAppSDK['cma'],
  appDefinitionId: string,
  options?: { limit?: number; offset?: number },
  onProgress?: (processed: number, total: number) => void
): Promise<JsonFieldsResult> {
  // Fetch ALL content types (not just first 100)
  const contentTypes = await cma.contentType.getMany({
    query: { limit: 1000 },
  });

  // OPTIMIZATION 1: Filter to only content types that have JSON Object fields
  // This dramatically reduces the number of editor interface calls needed
  const contentTypesWithJsonFields: ContentTypeWithJsonFields[] = contentTypes.items
    .map((contentType) => {
      const jsonFields = contentType.fields.filter((f) => f.type === JsonFieldType);
      return { contentType, jsonFields };
    })
    .filter(({ jsonFields }) => jsonFields.length > 0);

  if (contentTypesWithJsonFields.length === 0) {
    return {
      fields: [],
      totalContentTypes: contentTypes.items.length,
      processedContentTypes: 0,
      hasMore: false,
    };
  }

  // Apply pagination (offset and limit)
  const offset = options?.offset || 0;
  const limit = options?.limit || INITIAL_BATCH_SIZE;
  const totalWithJsonFields = contentTypesWithJsonFields.length;

  // Apply offset and limit for pagination
  const startIndex = offset;
  const endIndex = Math.min(offset + limit, totalWithJsonFields);
  const paginatedContentTypes = contentTypesWithJsonFields.slice(startIndex, endIndex);
  const hasMore = endIndex < totalWithJsonFields;

  if (paginatedContentTypes.length === 0) {
    return {
      fields: [],
      totalContentTypes: contentTypes.items.length,
      processedContentTypes: 0,
      hasMore: false,
    };
  }

  // Report initial progress
  if (onProgress) {
    onProgress(0, paginatedContentTypes.length);
  }

  // OPTIMIZATION 2: Fetch editor interfaces in batches with retry logic
  const resolvedEditorInterfaces = await fetchEditorInterfacesBatch(cma, paginatedContentTypes, onProgress);

  // OPTIMIZATION 3: Build the final result efficiently
  const jsonFields: JsonField[] = [];

  for (const { contentType, editorInterface, jsonFields: ctJsonFields } of resolvedEditorInterfaces) {
    for (const jsonField of ctJsonFields) {
      const control = editorInterface.controls?.find((w: Control) => w.fieldId === jsonField.id);
      const isUsingApp = !!control && control.widgetId === appDefinitionId;
      jsonFields.push({
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        fieldId: jsonField.id,
        fieldName: jsonField.name,
        isEnabled: isUsingApp,
        originalEnabled: isUsingApp,
      });
    }
  }

  const sortedFields = jsonFields.sort((a, b) => {
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
  });

  return {
    fields: sortedFields,
    totalContentTypes: totalWithJsonFields,
    processedContentTypes: paginatedContentTypes.length,
    hasMore,
  };
}

export function groupFieldsByContentType(fields: JsonField[]): Record<string, JsonField[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) acc[field.contentTypeId] = [];
    acc[field.contentTypeId].push(field);
    return acc;
  }, {} as Record<string, JsonField[]>);
}

export function buildEditorInterfaceControls(allFields: JsonField[], existingControls: Control[] = [], appId: string): Control[] {
  const managedFieldIds = new Set(allFields.map((f) => f.fieldId));

  const baseControls = existingControls.filter((c) => !managedFieldIds.has(c.fieldId));

  const updatedControls: Control[] = [
    ...baseControls,
    ...allFields.map((field) => ({
      fieldId: field.fieldId,
      widgetId: field.isEnabled ? appId : DefaultWidgetId,
      widgetNamespace: field.isEnabled ? AppWidgetNamespace : 'builtin',
    })),
  ];

  return updatedControls.filter((c) => c.fieldId && c.widgetId && c.widgetNamespace);
}
