// src/components/EntryEditor/types.ts

import { EditorAppSDK } from '@contentful/app-sdk';
import { FlagMode, RolloutStrategy, VariationType, VariationValue } from '../../types/launchdarkly';

// Add Contentful Reference type
export interface ContentfulReference {
  sys: {
    id: string;
    type: 'Link';
    linkType: 'Entry';
  };
}

// Enhanced FlagFormState with all the flag management capabilities
export interface FlagFormState {
  name: string;
  key: string;
  description: string;
  projectKey: string;
  variationType: VariationType;
  variations: Array<{ value: VariationValue; name: string }>;
  defaultVariation: number; // at the moment, this will always be 0
  existingFlagKey?: string;
  mode: FlagMode;
  // Change to Reference Array - array index corresponds to variation index
  contentMapping: ContentfulReference[];
}

// Extended SDK for flag management capabilities
export interface ExtendedEditorAppSDK extends EditorAppSDK {
  entry: EditorAppSDK['entry'] & {
    fields: EditorAppSDK['entry']['fields'] & {
      mode: { getValue: () => FlagMode };
    };
  };
  window: {
    startAutoResizer: () => void;
    stopAutoResizer: () => void;
  };
}

export interface ContentfulEntry {
  sys: {
    id: string;
    type: string;
    linkType: string;
  };
}

// Enhanced ContentfulEntry with more metadata
export interface EnhancedContentfulEntry extends ContentfulEntry {
  metadata?: {
    entryTitle?: string;
    contentTypeName?: string;
    contentTypeId?: string;
    thumbnailUrl?: string;
  };
}

// Content type field information 
export interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  localized?: boolean;
  items?: {
    type: string;
    linkType?: string;
  };
  linkType?: string;
}

// Content type definition
export interface ContentType {
  sys: {
    id: string;
    version?: number;
  };
  name: string;
  displayField: string;
  description?: string;
  fields: ContentTypeField[];
}

// Entry preview data for display
export interface EntryPreviewData {
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'changed' | 'archived';
  contentType: string;
  contentTypeId: string;
  fields?: Record<string, unknown>;
  media?: {
    url?: string;
    width?: number;
    height?: number;
    type?: string;
  };
}

/**
 * Enhanced FlagFormState that bridges the gap between Contentful's simple storage format
 * and the UI's need for rich metadata.
 * 
 * Problem: Contentful contentMapping only store simple entry IDs (e.g., "entry-id-123"),
 * but the UI needs rich metadata (entry titles, content type names, etc.) for display.
 * 
 * Solution: This interface extends FlagFormState with enhancedVariationContent that contains
 * the full metadata for each referenced entry, while keeping the original contentMapping
 * for simple storage/retrieval from Contentful.
 */
export interface EnhancedFlagFormState extends FlagFormState {
  /**
   * Rich metadata for each variation's content mapping.
   * Key: variation index (number)
   * Value: Enhanced entry with metadata (title, content type, etc.)
   * 
   * This is populated by fetching full entry data for each ID in contentMapping,
   * allowing the UI to display meaningful information instead of just entry IDs.
   */
  enhancedVariationContent?: Record<number, EnhancedContentfulEntry>;
}

// Filter options for content types
export interface ContentTypeFilter {
  search?: string;
  onlyEntryTypes?: boolean;
  excludeTypes?: string[];
  includeTypes?: string[];
}

export interface VariationContentMappingProps {
  variation: { name: string; value: VariationValue };
  variationIndex: number;
  entryLink?: EnhancedContentfulEntry;
  onSelectContent: (index: number, entry: EnhancedContentfulEntry) => void;
  onEditEntry: (entryId: string) => void;
  onRemoveContent: () => void;
}