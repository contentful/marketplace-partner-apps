'use client';

import { EditorAppSDK } from '@contentful/app-sdk';
import { Heading, Note, Flex, Text, Card, Box } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import React, { useState, useEffect } from 'react';

import { FlagDetailsSection } from '../components/EntryEditor/components/FlagDetailsSection';
import { ModeSelection } from '../components/EntryEditor/components/ModeSelection';

import { ErrorBoundary } from '../components/ErrorBoundary/index';
import { ContentTypesProvider } from '../components/EntryEditor/contexts/ContentTypesContext';

import { useErrorState, useFlags, useUnsavedChanges, useFlagCreation } from '../hooks';
import { callAppAction } from '../utils/appAction';
import { EnhancedContentfulEntry, FlagFormState } from '../components/EntryEditor/types';
import { FlagMode, VariationType, FeatureFlag } from '../types/launchdarkly';

const EntryEditor = () => {
  const sdk = useSDK<EditorAppSDK>();
  const { error, handleError } = useErrorState('EntryEditor');
  const [enhancedVariationContent, setEnhancedVariationContent] = useState<Record<number, EnhancedContentfulEntry>>({});
  
  // Track whether a flag has already been created/selected for this entry
  const [flagCreationLocked, setFlagCreationLocked] = useState(false);
  
  // Basic form state with proper defaults for enhanced FlagFormState
  const [formState, setFormState] = useState<FlagFormState>({
    variations: [],
    contentMapping: [], // Change to array
    meta: {},
    name: '',
    key: '',
    description: '',
    projectKey: '',
    variationType: 'boolean',
    defaultVariation: 0,
    mode: null,
  });
  // Loading state
  const [loading, setLoading] = useState({ entry: true, saving: false });
  // Track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // Store configured project key and environment from app parameters
  // These are app-level settings that will support FUTURE multi-environment features
  const [configuredProjectKey, setConfiguredProjectKey] = useState<string>('');
  const [configuredEnvironment, setConfiguredEnvironment] = useState<string>('');
  // UI state
  const [search, setSearch] = useState('');
  const { flags: launchDarklyFlags, loading: flagsLoading, refreshFlags, mergeFlag } = useFlags();
  
  // Track unsaved changes
  const { hasUnsavedChanges, resetLastSavedState } = useUnsavedChanges(formState);
  
  // Flag creation hook
  const { createFlag, loading: flagCreationLoading, error: flagCreationError } = useFlagCreation();
  
  // Combined loading state for UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isSaving = loading.saving || flagCreationLoading;
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reflect flag name into entry's display field (typically 'name') so top header updates
  useEffect(() => {
    const update = setTimeout(() => {
      try {
        sdk.entry.fields.name?.setValue(formState.name || '');
      } catch (e) {
        console.error('[EntryEditor] Failed to set entry name field from flag name', e);
      }
    }, 200);
    return () => clearTimeout(update);
  }, [formState.name, sdk.entry.fields]);

  useEffect(() => {
    // Only run the initial load once
    if (initialLoadComplete) return;
    
    const loadSavedEntryData = async () => {
      try {
        setLoading(prev => ({ ...prev, entry: true }));
        
        // Get configured project key and environment from app parameters (compatible with different SDK types)
        // These settings will support FUTURE multi-environment features and environment-specific operations
        let projectKey = '';
        let environment = '';
        if ('app' in sdk && typeof (sdk as { app: { getParameters: () => Promise<{ launchDarklyProjectKey?: string; launchDarklyEnvironment?: string }> } }).app?.getParameters === 'function') {
          const appParameters = await (sdk as { app: { getParameters: () => Promise<{ launchDarklyProjectKey?: string; launchDarklyEnvironment?: string }> } }).app.getParameters();
          projectKey = appParameters?.launchDarklyProjectKey || '';
          environment = appParameters?.launchDarklyEnvironment || '';
        } else {
          projectKey = (sdk as { parameters?: { installation?: { launchDarklyProjectKey?: string; launchDarklyEnvironment?: string } } }).parameters?.installation?.launchDarklyProjectKey || '';
          environment = (sdk as { parameters?: { installation?: { launchDarklyProjectKey?: string; launchDarklyEnvironment?: string } } }).parameters?.installation?.launchDarklyEnvironment || '';
        }
        setConfiguredProjectKey(projectKey);
        setConfiguredEnvironment(environment);
        
        const fields = sdk.entry.fields;
        
        // Check if there are existing content mappings
        const existingContentMappings = fields.contentMapping?.getValue() || [];

        const metaField = (fields as { meta?: { getValue?: () => Record<string, string> | null } }).meta;
        const existingMeta = typeof metaField?.getValue === 'function' ? metaField.getValue() || {} : {};
  
        // Helper function to infer variation type from variations data
        const inferVariationType = (variations: Array<{ value: unknown; name: string }>): VariationType => {
          if (!variations || variations.length === 0) return 'boolean';
          
          // Check if it's a boolean flag (True/False)
          if (variations.length === 2 && 
              variations[0]?.name === 'True' && variations[0]?.value === true &&
              variations[1]?.name === 'False' && variations[1]?.value === false) {
            return 'boolean';
          }
          
          // Check the first variation's value type
          const firstValue = variations[0]?.value;
          if (typeof firstValue === 'number') return 'number';
          if (typeof firstValue === 'string') return 'string';
          if (typeof firstValue === 'object') return 'json';
          
          return 'string'; // default fallback
        };

        const variations = fields.variations?.getValue() || [];
        
        // Convert Reference Array to simple mapping for internal use
        const simpleMapping: Record<string, string> = {};
        if (Array.isArray(existingContentMappings)) {
          existingContentMappings.forEach((reference, index) => {
            if (reference && typeof reference === 'object' && 'sys' in reference) {
              simpleMapping[index.toString()] = (reference as { sys: { id: string } }).sys.id;
            }
          });
        }
        
        const savedState: FlagFormState = {
          variations: variations,
          contentMapping: existingContentMappings, // Keep as Reference Array for storage
          meta: existingMeta,
          name: fields.name?.getValue() || '',
          key: fields.key?.getValue() || '',
          description: fields.description?.getValue() || '',
          projectKey: projectKey, // Use configured project key
          variationType: inferVariationType(variations),
          defaultVariation: 0, // Always 0, not persisted to Contentful
          // Infer mode from data: if flag key exists, must be 'existing'
          mode: null // Will be set below after checking hasFlagKey
        };

        // If there is already a flag key stored on the entry, lock out create mode
        const hasFlagKey = !!savedState.key && savedState.key.trim().length > 0;
        setFlagCreationLocked(hasFlagKey);
        
        // Set mode to 'existing' if flag is selected (key exists)
        if (hasFlagKey) {
          savedState.mode = 'existing';
        }

        // Convert simple mapping to enhanced content with rich metadata
        const enhancedContent: Record<number, EnhancedContentfulEntry> = {};

        await Promise.all(
          Object.entries(simpleMapping).map(async ([index, entryId]) => {
            if (entryId) {
              const enhanced = await fetchEnhancedEntry(entryId, sdk);
              if (enhanced) {
                enhancedContent[Number(index)] = enhanced;
              }
            }
          })
        );
  
        setFormState(savedState);
        setEnhancedVariationContent(enhancedContent);
        setInitialLoadComplete(true); // Mark initial load as complete
      } catch (err) {
        handleError(err instanceof Error ? err : new Error('Failed to load entry data'));
      } finally {
        setLoading(prev => ({ ...prev, entry: false }));
      }
    };
    loadSavedEntryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadComplete]);

  /**
   * Fetches rich metadata for a Contentful entry to enhance the UI display.
   * 
   * This function converts a simple entry ID into an EnhancedContentfulEntry with
   * metadata like entry title, content type name, etc. This is needed because
   * Contentful's contentMapping only store simple IDs, but the UI needs rich
   * information to display meaningful content to users.
   * 
   * @param entryId - The Contentful entry ID to fetch metadata for
   * @param sdk - The Contentful SDK instance
   * @returns Enhanced entry with metadata, or undefined if fetch fails
   */
  const fetchEnhancedEntry = async (entryId: string, sdk: EditorAppSDK) => {
    try {
      const entry = await sdk.cma.entry.get({ entryId });
      const contentType = await sdk.cma.contentType.get({ contentTypeId: entry.sys.contentType.sys.id });
      return {
        sys: {
          id: entryId,
          type: 'Link',
          linkType: 'Entry'
        },
        metadata: {
          entryTitle: entry.fields[contentType.displayField]?.[sdk.locales.default] || 'Untitled',
          contentTypeName: contentType.name,
          contentTypeId: contentType.sys.id
        }
      };
    } catch (err) {
      console.error('Failed to fetch entry for id', entryId, err);
      return undefined;
    }
  };

  // Handle mode change
  const handleModeChange = (newMode: FlagMode) => {
    // If switching to existing and no flag has been created/selected, reset to clean mapping state
    if (newMode === 'existing' && !flagCreationLocked) {
      resetForm('existing');
      // Also clear the search input so dropdown doesn't auto-fill from create flow
      setSearch('');
      return;
    }
    setFormState(prev => ({
      ...prev,
      mode: newMode
    }));
  };

  // Reset form to initial state
  const resetForm = (newMode?: FlagMode) => {
    // Use the provided newMode or fall back to current mode
    const modeToUse = newMode !== undefined ? newMode : formState.mode;
    
    const defaultState: FlagFormState = {
      variations: [],
      contentMapping: [], // Change to empty array
      meta: {},
      name: '',
      key: '',
      description: '',
      projectKey: formState.projectKey, // Keep project key
      variationType: 'boolean',
      defaultVariation: 0,
      mode: modeToUse, // Use the correct mode
    };
    setFormState(defaultState);
    setEnhancedVariationContent({});
    resetLastSavedState();
  };

  // Load existing flags when switching to 'existing' mode
  const loadExistingFlags = () => {
    // The useFlags hook already loads flags based on search
    // This function is for compatibility with ModeSelection
    console.log('Loading existing flags...');
  };

  // Handle form changes with validation
  const handleFormChange = (field: keyof FlagFormState, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle flag selection
  const handleFlagSelect = (item: FeatureFlag) => {
    if (!item) return;
    
    setFormState(prev => ({
      ...prev,
      variations: item.variations || [],
      name: item.name || '',
      key: item.key || '',
      description: item.description || '',
      existingFlagKey: item.key || '',
    }));
  };

  // Handle saving - now only for content mapping mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = async () => {
    // This function is now deprecated - auto-save handles all saving
    sdk.notifier.success('Changes are saved automatically');
  };

  if (loading.entry || (flagsLoading && !launchDarklyFlags)) {
    return (
      <ErrorBoundary componentName="EntryEditor" onError={handleError}>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px' }}>
          <Text>Loading entry data...</Text>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentName="EntryEditor" onError={handleError}>
      <ContentTypesProvider>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px', paddingBottom: '32px' }}>
        {error.message && (
          <Note variant="negative" style={{ marginBottom: '16px' }}>{error.message}</Note>
        )}
        
        {flagCreationError && (
          <Note variant="negative" style={{ marginBottom: '16px' }}>
            Flag Creation Error: {flagCreationError}
          </Note>
        )}
        
        {validationErrors.general && (
          <Note variant="negative" style={{ marginBottom: '16px' }}>
            {validationErrors.general}
          </Note>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card padding="default">
            <Box paddingLeft="spacingM" paddingRight="spacingM">
              <Heading marginBottom='spacing2Xs'>LaunchDarkly Flag Management</Heading>
              <Text fontColor="gray600">
                {flagCreationLocked 
                  ? 'Manage your content mappings for this flag.'
                  : 'Create a new feature flag or link an existing one to this entry.'
                }
              </Text>
              
              {!flagCreationLocked && (
                <Card padding="default" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', marginTop: '16px' }}>
                  <Text fontColor="gray700" fontSize="fontSizeS">
                    <strong>Note:</strong> Feature flags are the basis for <strong>Experimentation</strong> in LaunchDarkly. If you need more information about Experiments in LaunchDarkly, see our documentation here: <a href="https://docs.launchdarkly.com/docs/experiments" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>https://docs.launchdarkly.com/docs/experiments</a>
                  </Text>
                </Card>
              )}
            </Box>
          </Card>

          {/* Mode Selection - only show if flag not yet selected */}
          {!flagCreationLocked && (
            <ModeSelection
              flagMode={formState.mode}
              onModeChange={handleModeChange}
              onLoadExistingFlags={loadExistingFlags}
              hasUnsavedChanges={hasUnsavedChanges}
              onResetForm={resetForm}
              hideCreateNew={flagCreationLocked}
              disableCreateNew={formState.mode === 'new'}
            />
          )}

          {/* Show flag details if mode is selected OR if flag is locked */}
          {(formState.mode || flagCreationLocked) && (
            <FlagDetailsSection
              formState={formState}
              launchDarklyFlags={launchDarklyFlags || []}
              flagsLoading={flagsLoading}
              search={search}
              onSearchChange={setSearch}
              onFlagSelect={handleFlagSelect}
              onFormChange={handleFormChange}
              enhancedVariationContent={enhancedVariationContent}
              setEnhancedVariationContent={setEnhancedVariationContent}
              validationErrors={validationErrors}
              configuredProjectKey={configuredProjectKey}
              configuredEnvironment={configuredEnvironment}
              createFlag={createFlag}
              flagCreationLoading={flagCreationLoading}
              onFlagLocked={() => setFlagCreationLocked(true)}
              onFlagCreated={(flag) => {
                // Clear validation errors when flag is created successfully
                setValidationErrors({});
                // Refresh the flags list to include the newly created flag
                refreshFlags();

                // Optimistically merge the created flag immediately so it appears in dropdown
                try {
                  mergeFlag(flag);
                } catch {}

                // Also fetch full flag details and merge for completeness
                (async () => {
                  try {
                    if (configuredProjectKey && (flag?.key || formState.key)) {
                      const detailed = await callAppAction<FeatureFlag>(sdk as any, 'getFlagDetails', {
                        projectKey: configuredProjectKey,
                        flagKey: flag?.key || formState.key,
                      });
                      if (detailed) {
                        mergeFlag(detailed);
                      }
                    }
                  } catch (e) {
                    console.warn('[EntryEditor] Failed to fetch created flag details, using optimistic data', e);
                  }
                })();

                // Lock out create mode for this entry going forward
                setFlagCreationLocked(true);
                // Keep the UI in create mode to show success panel; update form fields only
                setFormState(prev => ({
                  ...prev,
                  key: flag.key || prev.key,
                  name: flag.name || prev.name,
                  description: flag.description || prev.description,
                  variations: flag.variations || prev.variations,
                }));

                // Persist key/name/description/variations onto the Contentful entry so lock survives reloads
                (async () => {
                  try {
                    const fields = sdk.entry.fields;
                    await fields.key?.setValue(flag.key || formState.key);
                    await fields.name?.setValue(flag.name || formState.name);
                    await fields.description?.setValue(flag.description || formState.description);
                    await fields.variations?.setValue(flag.variations || formState.variations);
                    // Note: mode is not persisted to Contentful, it's inferred from data on load
                    await sdk.entry.save();
                  } catch (e) {
                    console.error('[EntryEditor] Failed to persist created flag fields to entry', e);
                  }
                })();
              }}
            />
          )}

          {/* Auto-save status message - replaces save button */}
          {formState.mode === 'existing' && (
            <Flex justifyContent="flex-end" marginTop="spacingL">
              <Text fontSize="fontSizeS" fontColor="gray500">
                Changes are saved automatically
              </Text>
            </Flex>
          )}

          {/* FlagControls removed for security - users should only create flags, not modify them */}
        </div>
        </div>
      </ContentTypesProvider>
    </ErrorBoundary>
  );
};

export default EntryEditor;

