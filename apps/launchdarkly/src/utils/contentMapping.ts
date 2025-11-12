import { EnhancedFlagFormState } from '../components/EntryEditor/types';

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