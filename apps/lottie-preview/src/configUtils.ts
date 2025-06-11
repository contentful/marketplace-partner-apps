import { ConfigAppSDK } from '@contentful/app-sdk';

const jsonFieldType = 'Object';

// Batch configuration for API requests
const BATCH_SIZE = 10; // Process editor interfaces in batches of 10
const RETRY_DELAY = 500; // Base delay for retries (ms)
const MAX_RETRIES = 3; // More retries with better backoff
const OVERALL_TIMEOUT = 120000; // 2 minute timeout for large content models
const BATCH_DELAY = 200; // Delay between batches to avoid rate limits
const INITIAL_BATCH_SIZE = 1000; // Load all content types on initial load

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES, delay: number = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.message?.includes('rate limit') || error?.message?.includes('429'))) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
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

    let count = 0;
    for (const contentType of contentTypes.items) {
      const hasJsonFields = contentType.fields.some((f) => f.type === jsonFieldType);
      if (hasJsonFields) {
        count++;
      }
    }

    return count;
  } catch (error: any) {
    console.error('getContentTypesWithJsonFieldsCount failed:', error);
    return 0;
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
    console.error('getJsonFields failed:', error);
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
  const contentTypes = await cma.contentType.getMany({
    query: { limit: 1000 },
  });

  // Filter to only content types that have JSON Object fields
  const contentTypesWithJson = contentTypes.items
    .map((contentType) => ({
      contentType,
      jsonFields: contentType.fields.filter((f) => f.type === jsonFieldType),
    }))
    .filter(({ jsonFields }) => jsonFields.length > 0);

  if (contentTypesWithJson.length === 0) {
    return {
      fields: [],
      totalContentTypes: contentTypes.items.length,
      processedContentTypes: 0,
      hasMore: false,
    };
  }

  const offset = options?.offset || 0;
  const limit = options?.limit || INITIAL_BATCH_SIZE;
  const totalWithJsonFields = contentTypesWithJson.length;

  const endIndex = Math.min(offset + limit, totalWithJsonFields);
  const paginatedContentTypes = contentTypesWithJson.slice(offset, endIndex);
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

  // Process in batches to avoid rate limits
  const results: JsonField[] = [];
  for (let i = 0; i < paginatedContentTypes.length; i += BATCH_SIZE) {
    const batch = paginatedContentTypes.slice(i, i + BATCH_SIZE);

    // Process each content type in the batch with retry logic
    const batchPromises = batch.map(async ({ contentType, jsonFields }) => {
      try {
        const editorInterface = await retryWithBackoff(() => cma.editorInterface.get({ contentTypeId: contentType.sys.id }));

        // Map fields to our format
        return jsonFields.map((jsonField) => {
          const control = editorInterface.controls?.find((w: Control) => w.fieldId === jsonField.id);
          const isUsingApp = !!control && control.widgetId === appDefinitionId;

          return {
            contentTypeId: contentType.sys.id,
            contentTypeName: contentType.name,
            fieldId: jsonField.id,
            fieldName: jsonField.name,
            isEnabled: isUsingApp,
            originalEnabled: isUsingApp,
          };
        });
      } catch (error) {
        console.error(`Failed to fetch editor interface for ${contentType.name}:`, error);
        // Return fields with default state if we can't fetch the editor interface
        return jsonFields.map((jsonField) => ({
          contentTypeId: contentType.sys.id,
          contentTypeName: contentType.name,
          fieldId: jsonField.id,
          fieldName: jsonField.name,
          isEnabled: false,
          originalEnabled: false,
        }));
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());

    if (onProgress) {
      const processed = Math.min(i + BATCH_SIZE, paginatedContentTypes.length);
      onProgress(processed, paginatedContentTypes.length);
    }

    // Add a delay between batches to avoid rate limits
    if (i + BATCH_SIZE < paginatedContentTypes.length) {
      await sleep(BATCH_DELAY);
    }
  }

  results.sort((a, b) => {
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
  });

  return {
    fields: results,
    totalContentTypes: totalWithJsonFields,
    processedContentTypes: paginatedContentTypes.length,
    hasMore,
  };
}

export function groupFieldsByContentType(fields: JsonField[]): Record<string, JsonField[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) {
      acc[field.contentTypeId] = [];
    }
    acc[field.contentTypeId].push(field);
    return acc;
  }, {} as Record<string, JsonField[]>);
}
