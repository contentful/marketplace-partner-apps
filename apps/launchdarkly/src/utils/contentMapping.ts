import { EnhancedFlagFormState, ContentfulReference } from '../components/EntryEditor/types';
import { VariationValue } from '../types/launchdarkly';
import { sanitizeFlagKey } from './validation';

/**
 * Converts enhanced variation content to Reference Array for Contentful storage.
 * 
 * This function creates an array of reference objects where the array index
 * corresponds to the variation index (strict order enforcement).
 * 
 * @param enhancedState - The enhanced form state containing rich entry metadata
 * @returns Array of reference objects
 */
export const extractReferenceArrayContentMapping = (enhancedState: EnhancedFlagFormState): Array<{ sys: { id: string; type: 'Link'; linkType: 'Entry' } }> => {
  const result: Array<{ sys: { id: string; type: 'Link'; linkType: 'Entry' } }> = [];
  
  if (enhancedState.enhancedVariationContent) {
    // Sort by variation index to ensure correct array order
    const sortedEntries = Object.entries(enhancedState.enhancedVariationContent)
      .sort(([a], [b]) => Number(a) - Number(b));
    
    sortedEntries.forEach(([index, entry]) => {
      const arrayIndex = Number(index);
      result[arrayIndex] = {
        sys: {
          id: entry.sys.id,
          type: 'Link',
          linkType: 'Entry'
        }
      };
    });
  }
  
  return result;
};

/**
 * Converts Reference Array back to simple mapping for backward compatibility.
 * 
 * @param referenceArray - Array of reference objects
 * @returns Simple mapping of variation index to entry ID
 */
export const convertReferenceArrayToSimpleMapping = (referenceArray: Array<{ sys: { id: string; type: 'Link'; linkType: 'Entry' } }>): Record<string, string> => {
  const result: Record<string, string> = {};
  
  referenceArray.forEach((reference, index) => {
    if (reference && reference.sys) {
      result[index.toString()] = reference.sys.id;
    }
  });
  
  return result;
};

/**
 * Converts simple mapping to Reference Array format.
 * 
 * @param simpleMapping - Simple mapping of variation index to entry ID
 * @returns Array of reference objects
 */
export const convertSimpleMappingToReferenceArray = (simpleMapping: Record<string, string>): Array<{ sys: { id: string; type: 'Link'; linkType: 'Entry' } }> => {
  const result: Array<{ sys: { id: string; type: 'Link'; linkType: 'Entry' } }> = [];
  
  Object.entries(simpleMapping).forEach(([index, entryId]) => {
    const arrayIndex = Number(index);
    result[arrayIndex] = {
      sys: {
        id: entryId,
        type: 'Link',
        linkType: 'Entry'
      }
    };
  });
  
  return result;
};

// Keep the old function for backward compatibility during transition
export const extractSimpleContentMapping = (enhancedState: EnhancedFlagFormState): Record<string, string> => {
  const result: Record<string, string> = {};
  
  if (enhancedState.enhancedVariationContent) {
    Object.entries(enhancedState.enhancedVariationContent).forEach(([index, entry]) => {
      result[index] = entry.sys.id;
    });
  }
  
  return result;
};

type VariationLike = {
  name?: string;
  value?: VariationValue;
  key?: string;
};

const ensureUniqueKey = (candidate: string, usedKeys: Set<string>, fallback: string) => {
  let sanitized = sanitizeFlagKey(candidate);
  if (!sanitized) {
    sanitized = fallback;
  }
  let unique = sanitized;
  let attempt = 1;
  while (usedKeys.has(unique)) {
    unique = `${sanitized}-${attempt++}`;
  }
  usedKeys.add(unique);
  return unique;
};

/**
 * Builds a lightweight variation → entry ID map, mirroring the Optimizely meta field.
 * Can build from either enhancedVariationContent OR contentMapping references.
 */
export const buildVariationMetaMapping = (
  variations: Array<{ value: VariationValue; name?: string; key?: string }> = [],
  contentSource: ContentfulReference[] | Record<number, EnhancedContentfulEntry> = [],
): Record<string, string> => {
  const meta: Record<string, string> = {};
  const usedKeys = new Set<string>();

  variations.forEach((variation, index) => {
    // Handle both array (contentMapping) and object (enhancedVariationContent) sources
    let entryId: string | undefined;
    if (Array.isArray(contentSource)) {
      entryId = contentSource[index]?.sys?.id;
    } else {
      entryId = contentSource[index]?.sys?.id;
    }

    if (!entryId) {
      return;
    }

    // Use the variation value as the key since that's what LaunchDarkly returns
    // This enables direct lookup: meta[ldClient.variation('flag', default)]
    let candidate: string;
    if (typeof variation?.value === 'object' && variation.value !== null) {
      // For JSON values, serialize them
      candidate = JSON.stringify(variation.value);
    } else {
      // For primitives (boolean, string, number), convert to string
      candidate = String(variation?.value ?? `variation-${index}`);
    }

    const fallback = `variation-${index}`;
    const metaKey = ensureUniqueKey(candidate, usedKeys, fallback);

    meta[metaKey] = entryId;
  });

  return meta;
};

export const isMetaMappingEqual = (
  a: Record<string, string> | undefined | null,
  b: Record<string, string>,
): boolean => {
  if (!a) {
    return Object.keys(b).length === 0;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
};