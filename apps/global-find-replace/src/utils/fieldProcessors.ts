import { DiffLine, ReplaceResult } from '../types';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';

/**
 * Processes simple field values (Text, Symbol, Integer, Number, Boolean, Date)
 */
function replaceSimpleValue(value: any, find: string, replace: string, caseSensitive: boolean = false): ReplaceResult | null {
  const strVal = String(value);

  if (!strVal.toLowerCase().includes(find.toLowerCase())) return null;

  if (!caseSensitive) {
    const updated = strVal.replace(new RegExp(find, 'gi'), replace);
    return {
      original: strVal,
      updated,
      diffLines: getRelevantDiff(value, find, replace, caseSensitive),
    };
  }

  if (!strVal.includes(find)) return null;

  const result = strVal.replaceAll(find, replace);
  return {
    original: strVal,
    updated: result,
    diffLines: getRelevantDiff(value, find, replace, caseSensitive),
  };
}

/**
 * Processes object field values with deep replacement
 */
function replaceObjectValue(value: any, find: string, replace: string, caseSensitive: boolean = false): ReplaceResult | null {
  const deepReplace = (input: any): any => {
    if (typeof input === 'string') {
      // Use processSimpleValue to handle the replacement consistently
      const result = replaceSimpleValue(input, find, replace, caseSensitive);
      return result ? result.updated : input;
    }

    if (Array.isArray(input)) {
      return input.map(deepReplace);
    }

    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input).map(([key, val]) => [key, deepReplace(val)]));
    }

    return input;
  };

  const updated = deepReplace(value);
  const originalStr = JSON.stringify(value);
  const updatedStr = JSON.stringify(updated);

  if (originalStr === updatedStr) return null;

  return {
    original: originalStr,
    updated: updatedStr,
    diffLines: getRelevantDiff(originalStr, find, replace, caseSensitive),
  };
}

/**
 * Processes RichText field values with deep replacement
 */
function replaceRichTextValue(value: any, find: string, replace: string, caseSensitive: boolean = false): ReplaceResult | null {
  const deepReplace = (node: any): any => {
    if (!node || typeof node !== 'object') return node;

    if (node.nodeType === 'text' && typeof node.value === 'string') {
      // Use processSimpleValue to handle the replacement consistently
      const result = replaceSimpleValue(node.value, find, replace, caseSensitive);
      if (result) {
        return {
          ...node,
          value: result.updated,
        };
      }
      return node;
    }

    if (Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(deepReplace),
      };
    }

    return Object.fromEntries(Object.entries(node).map(([key, val]) => [key, deepReplace(val)]));
  };

  const updated = deepReplace(value);
  const originalStr = JSON.stringify(value);
  const updatedStr = JSON.stringify(updated);

  if (originalStr === updatedStr) return null;

  return {
    original: originalStr,
    updated: updatedStr,
    diffLines: getRelevantDiff(documentToPlainTextString(value), find, replace, caseSensitive),
  };
}

const getRelevantDiff = (value: any, find: string, replace: string, caseSensitive: boolean = false): DiffLine[] => {
  // Convert value to string first to handle non-string values
  const valueStr = String(value);

  // Prepare search string based on case sensitivity
  const searchStr = caseSensitive ? valueStr : valueStr.toLowerCase();
  const findStr = caseSensitive ? find : find.toLowerCase();

  // Find all indexes of the 'find' string
  const indexes: number[] = [];
  let index = searchStr.indexOf(findStr);

  while (index !== -1) {
    indexes.push(index);
    index = searchStr.indexOf(findStr, index + 1);
  }

  // If no matches found, return original unchanged
  if (indexes.length === 0) {
    return [{ diffOriginal: valueStr, diffUpdated: valueStr }];
  }

  // Create snippets with 50 chars on either side (100 total)
  const snippets: Array<{ start: number; end: number }> = [];

  for (const matchIndex of indexes) {
    let start = Math.max(0, matchIndex - 50);
    let end = Math.min(valueStr.length, matchIndex + find.length + 50);

    // Get start index at begining of word
    while (start != 0 && /\w/.test(valueStr[start - 1])) {
      start = start - 1;
    }

    // Get end index at end of word
    while (end != valueStr.length && /\w/.test(valueStr[end + 1])) {
      end = end + 1;
    }
    snippets.push({ start, end: end + 1 });
  }

  // Combine overlapping or continuous snippets
  const combinedSnippets: Array<{ start: number; end: number }> = [];

  // Sort snippets by start position
  snippets.sort((a, b) => a.start - b.start);

  let currentSnippet = snippets[0];

  for (let i = 1; i < snippets.length; i++) {
    const nextSnippet = snippets[i];

    // If snippets overlap or are continuous, combine them
    if (nextSnippet.start <= currentSnippet.end) {
      currentSnippet.end = Math.max(currentSnippet.end, nextSnippet.end);
    } else {
      // No overlap, add current snippet and start new one
      combinedSnippets.push(currentSnippet);
      currentSnippet = nextSnippet;
    }
  }

  // Add the last snippet
  combinedSnippets.push(currentSnippet);

  // Extract the text snippets onto different lines
  const originalSnippets = combinedSnippets.map(({ start, end }) => valueStr.slice(start, end));

  const diffLines: DiffLine[] = [];
  for (const snippet of originalSnippets) {
    const originalText = snippet;
    const updatedText = caseSensitive ? snippet.replaceAll(find, replace) : snippet.replace(new RegExp(find, 'gi'), replace);
    diffLines.push({ diffOriginal: originalText, diffUpdated: updatedText });
  }

  return diffLines;
};

/**
 * Processes field values based on their type definition
 */
export function replaceFieldValueByType(value: any, fieldDef: any, find: string, replace: string, caseSensitive: boolean = false): ReplaceResult | null {
  if (!value) return null;

  const fieldType = fieldDef.type;

  if (fieldType === 'RichText') {
    return replaceRichTextValue(value, find, replace, caseSensitive);
  }

  if (fieldType === 'Object') {
    return replaceObjectValue(value, find, replace, caseSensitive);
  }

  if (fieldType === 'Array' && fieldDef.items?.type === 'Object' && Array.isArray(value)) {
    const updatedItems = value.map((item) =>
      typeof item === 'object' && item !== null ? replaceObjectValue(item, find, replace, caseSensitive)?.updated : item,
    );

    const originalStr = JSON.stringify(value);
    const updatedStr = JSON.stringify(updatedItems);

    if (originalStr === updatedStr) return null;

    return {
      original: originalStr,
      updated: updatedStr,
      diffLines: getRelevantDiff(value, find, replace, caseSensitive),
    };
  }

  if (['Symbol', 'Text', 'Integer', 'Number', 'Boolean', 'Date'].includes(fieldType)) {
    return replaceSimpleValue(value, find, replace, caseSensitive);
  }

  return replaceSimpleValue(value, find, replace, caseSensitive);
}

/**
 * Checks if a field is a reference field
 */
export function isReferenceField(fieldDef: any): boolean {
  return fieldDef.type === 'Link' || (fieldDef.type === 'Array' && fieldDef.items?.type === 'Link');
}
