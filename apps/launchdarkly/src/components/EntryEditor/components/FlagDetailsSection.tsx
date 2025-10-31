import React, { useCallback, useEffect, useState } from 'react';
import { Card, Heading, Stack, Text, Autocomplete, Box, Form, FormControl, TextInput, Textarea, Flex, Tooltip, Note, Button } from '@contentful/f36-components';
import { InfoCircleIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EditorAppSDK } from '@contentful/app-sdk';
import { useDebouncedCallback } from 'use-debounce';
import { FlagFormState, EnhancedContentfulEntry } from '../types';
import { VariationContentSection } from './VariationContentSection';
import { VariationsForm } from './VariationsForm';
import { validateFlagData } from '../../../utils/validation';
import { sanitizeFlagKey } from '../../../utils/validation';
import { CreateFlagData, FeatureFlag } from '../../../types/launchdarkly';
import { extractReferenceArrayContentMapping } from '../../../utils/contentMapping';

interface FlagDetailsSectionProps {
  formState: FlagFormState;
  launchDarklyFlags: FeatureFlag[];
  flagsLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onFlagSelect: (item: FeatureFlag) => void;
  onFormChange: (field: keyof FlagFormState, value: unknown) => void;
  enhancedVariationContent: Record<number, EnhancedContentfulEntry>;
  setEnhancedVariationContent: React.Dispatch<React.SetStateAction<Record<number, EnhancedContentfulEntry>>>;
  validationErrors?: Record<string, string>;
  configuredProjectKey: string;
  /**
   * The configured LaunchDarkly environment from app settings.
   * Currently used for LaunchDarkly URL generation.
   * FUTURE: Will support multi-environment features like environment-specific content mappings.
   */
  configuredEnvironment: string;
  createFlag: (projectKey: string, flagData: CreateFlagData) => Promise<FeatureFlag>;
  flagCreationLoading: boolean;
  onFlagCreated?: (flag: FeatureFlag) => void;
}

export const FlagDetailsSection: React.FC<FlagDetailsSectionProps> = ({
  formState,
  launchDarklyFlags,
  flagsLoading,
  search,
  enhancedVariationContent,
  onSearchChange,
  onFlagSelect,
  onFormChange,
  setEnhancedVariationContent,
  validationErrors = {},
  configuredProjectKey,
  configuredEnvironment,
  createFlag,
  flagCreationLoading,
  onFlagCreated
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const [flagCreated, setFlagCreated] = useState(false);
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Validation function for auto-save operations
  const validateBeforeSave = (field: string, value: any): boolean => {
    switch (field) {
      case 'key':
        return value && value.trim().length > 0;
      case 'contentMapping':
        return Array.isArray(value);
      case 'name':
        return value && value.trim().length > 0;
      case 'description':
        return true; // Description can be empty
      case 'variations':
        return Array.isArray(value) && value.length > 0;
      default:
        return true;
    }
  };

  // Retry logic for failed auto-saves
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const retryAutoSave = async (field: string, value: any) => {
    setSaveStatus('saving');
    try {
      await sdk.entry.fields[field].setValue(value);
      setSaveStatus('saved');
    } catch (error) {
      console.error(`Retry auto-save failed for ${field}:`, error);
      setSaveStatus('error');
    }
  };

  // Auto-save error component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const AutoSaveError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
    <Note variant="negative">
      Auto-save failed: {error}
      <Button onClick={onRetry} size="small" style={{ marginLeft: '8px' }}>
        Retry
      </Button>
    </Note>
  );

  // Client-side filtering for better autocomplete experience
  const filteredFlags = React.useMemo(() => {
    if (!search || !search.trim()) {
      return launchDarklyFlags;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = launchDarklyFlags.filter(flag => 
      flag.name.toLowerCase().includes(searchLower) ||
      flag.key.toLowerCase().includes(searchLower)
    );
    
    console.log('[FlagDetailsSection] Search:', search);
    console.log('[FlagDetailsSection] Total flags:', launchDarklyFlags.length);
    console.log('[FlagDetailsSection] Filtered flags:', filtered.length);
    
    return filtered;
  }, [launchDarklyFlags, search]);

  useEffect(() => {
    if (launchDarklyFlags.length && formState.key) {
      const selectedFlag = launchDarklyFlags.find(flag => flag.key === formState.key);
      if (selectedFlag) {
        onSearchChange(`${selectedFlag.name} (${selectedFlag.key})`);
      }
    }
  }, [launchDarklyFlags, formState.key, onSearchChange]);

  // Reset manual edit tracking when mode changes or flag is created
  useEffect(() => {
    if (formState.mode === 'new' && !flagCreated) {
      setKeyManuallyEdited(false);
    }
  }, [formState.mode, flagCreated]);

  // Debounced auto-save for name field with validation
  const debouncedSaveName = useDebouncedCallback(async (value: string) => {
    if (formState.mode === 'existing' && validateBeforeSave('name', value)) {
      try {
        await sdk.entry.fields.name.setValue(value);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save name failed:', error);
        setSaveStatus('error');
      }
    }
  }, 1000);

  // Auto-generate key from name for new flags
  const handleNameChange = (value: string) => {
    if (creationError) setCreationError(null);
    onFormChange('name', value);
    
    // Auto-save for existing flags
    if (formState.mode === 'existing') {
      debouncedSaveName(value);
    }
    
    // Only auto-generate key if user hasn't manually edited it and we're in create mode
    if (formState.mode === 'new' && value && !keyManuallyEdited && !flagCreated) {
      const generatedKey = sanitizeFlagKey(value);
      onFormChange('key', generatedKey);
    }
  };

  // Debounced auto-save for description field with validation
  const debouncedSaveDescription = useDebouncedCallback(async (value: string) => {
    if (formState.mode === 'existing' && validateBeforeSave('description', value)) {
      try {
        await sdk.entry.fields.description.setValue(value);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save description failed:', error);
        setSaveStatus('error');
      }
    }
  }, 1000);

  // Handle manual key changes
  const handleKeyChange = (value: string) => {
    if (creationError) setCreationError(null);
    setKeyManuallyEdited(true);
    onFormChange('key', value);
  };

  // Handle description changes with auto-save
  const handleDescriptionChange = (value: string) => {
    if (creationError) setCreationError(null);
    onFormChange('description', value);
    
    // Auto-save for existing flags
    if (formState.mode === 'existing') {
      debouncedSaveDescription(value);
    }
  };

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    
    // If search is cleared (empty or just whitespace), clear the flag data
    if (!value || value.trim() === '') {
      onFormChange('key', '');
      onFormChange('name', 'Untitled');
      onFormChange('description', '');
      onFormChange('variations', []);
      onFormChange('existingFlagKey', '');
      // Also clear any mapped content
      setEnhancedVariationContent({});
    }
  };

  // Handle existing flag selection and loading details with auto-save and validation
  const handleExistingFlagSelect = async (flag: FeatureFlag) => {
    if (!flag) return;
    
    setSaveStatus('saving');
    
    // Update React state immediately (for UI feedback)
    onFormChange('existingFlagKey', flag.key);
    onFormChange('key', flag.key);
    onFormChange('name', flag.name);
    onFormChange('description', flag.description);
    onFormChange('variations', flag.variations);
    
    // Auto-save to Contentful fields with validation
    try {
      if (validateBeforeSave('key', flag.key)) {
        await sdk.entry.fields.key.setValue(flag.key);
      }
      if (validateBeforeSave('name', flag.name)) {
        await sdk.entry.fields.name.setValue(flag.name);
      }
      if (validateBeforeSave('description', flag.description)) {
        await sdk.entry.fields.description.setValue(flag.description);
      }
      if (validateBeforeSave('variations', flag.variations)) {
        await sdk.entry.fields.variations.setValue(flag.variations);
      }
      await sdk.entry.fields.mode.setValue('existing');
      
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      sdk.notifier.error('Failed to save flag selection. Please try again.');
    }
    
    // Load the full flag details
    try {
      onFlagSelect(flag);
    } catch (error) {
      sdk.notifier.error('Failed to load flag details');
    }
  };

  const handleSelectVariationContent = useCallback(async (variationIndex: number, entryLink: EnhancedContentfulEntry) => {
    setSaveStatus('saving');
    
    // Update React state immediately
    setEnhancedVariationContent(prev => {
      // Only create a new object if this specific variation is actually changing
      if (prev[variationIndex] === entryLink) {
        return prev; // Return the same object reference
      }
      
      // Create new object with only the changed variation
      const newContent = { ...prev };
      newContent[variationIndex] = entryLink;
      return newContent;
    });
    
    // Auto-save to Contentful field with validation
    try {
      const referenceArray = extractReferenceArrayContentMapping({
        ...formState,
        enhancedVariationContent: { ...enhancedVariationContent, [variationIndex]: entryLink }
      });
      
      if (validateBeforeSave('contentMapping', referenceArray)) {
        await sdk.entry.fields.contentMapping.setValue(referenceArray);
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Auto-save content mapping failed:', error);
      setSaveStatus('error');
      sdk.notifier.error('Failed to save content mapping. Please try again.');
    }
  }, [setEnhancedVariationContent, formState, enhancedVariationContent, sdk.notifier, sdk.entry.fields.contentMapping]);

  const handleRemoveVariationContent = useCallback(async (variationIndex: number) => {
    setSaveStatus('saving');
    
    // Update React state immediately
    setEnhancedVariationContent(prev => {
      // Only create a new object if this variation actually exists
      if (!(variationIndex in prev)) {
        return prev; // Return the same object reference
      }
      
      const newContent = { ...prev };
      delete newContent[variationIndex];
      return newContent;
    });
    
    // Auto-save to Contentful field with validation
    try {
      const referenceArray = extractReferenceArrayContentMapping({
        ...formState,
        enhancedVariationContent: { ...enhancedVariationContent }
      });
      
      if (validateBeforeSave('contentMapping', referenceArray)) {
        await sdk.entry.fields.contentMapping.setValue(referenceArray);
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Auto-save content removal failed:', error);
      setSaveStatus('error');
      sdk.notifier.error('Failed to remove content mapping. Please try again.');
    }
  }, [setEnhancedVariationContent, formState, enhancedVariationContent, sdk.notifier, sdk.entry.fields.contentMapping]);

  // Handler for editing an entry
  const handleEditEntry = useCallback(async (entryId: string) => {
    try {
      await sdk.navigator.openEntry(entryId, { slideIn: { waitForClose: true } });
    } catch (error) {
      sdk.notifier.error('Failed to open entry');
    }
  }, [sdk]);

  // Handle flag creation
  const handleCreateFlag = async () => {
    if (!configuredProjectKey) {
      setCreationError('No LaunchDarkly project configured. Please configure the app first.');
      return;
    }

    // Validate form before creating
    const validationResult = validateFlagData({
      name: formState.name,
      key: formState.key,
      description: formState.description,
      variations: formState.variations,
      kind: formState.variationType
    });

    if (!validationResult.isValid) {
      const uniqueMessages = Array.from(new Set(Object.values(validationResult.errors)));
      const topMessages = uniqueMessages.slice(0, 5);
      const details = topMessages.map(m => `• ${m}`).join('\n');
      const message = topMessages.length
        ? `Please fix the following before creating the flag:\n${details}`
        : 'Please fix validation errors before creating the flag.';
      setCreationError(message);
      return;
    }

    const flagData: CreateFlagData = {
      name: formState.name,
      key: formState.key,
      description: formState.description,
      kind: formState.variationType,
      variations: formState.variations,

    };

    try {
      setCreationError(null);
      const createdFlag = await createFlag(configuredProjectKey, flagData);
      console.log('Flag created successfully:', createdFlag);
      
      // Update form state with created flag data
      onFormChange('name', createdFlag.name || formState.name);
      onFormChange('key', createdFlag.key || formState.key);
      onFormChange('description', createdFlag.description || formState.description);
      onFormChange('variations', createdFlag.variations || formState.variations);
      
      console.log('[FlagDetailsSection] Flag created successfully:', {
        name: createdFlag.name || formState.name,
        key: createdFlag.key || formState.key
      });
      
      setFlagCreated(true);
      
      // Notify parent that flag was created
      if (onFlagCreated) {
        onFlagCreated(createdFlag);
      }
      // Success toast disabled; success card below provides next actions
      
    } catch (flagCreationErr) {
      console.error('Flag creation failed:', flagCreationErr);
      const message = `Failed to create flag: ${flagCreationErr instanceof Error ? flagCreationErr.message : 'Unknown error'}`;
      const hint = message.includes('distinct') ? '\n• Variation names/values must be unique.' : '';
      setCreationError(`${message}${hint}`);
    }
  };

  // Handle transition to content mapping mode
  const handleStartContentMapping = () => {
    // Switch to existing flag mode to start content mapping
    onFormChange('mode', 'existing');
    
    // Set the search value to show the newly created flag as selected
    if (formState.name && formState.key) {
      const searchValue = `${formState.name} (${formState.key})`;
      console.log('[FlagDetailsSection] Setting search value for newly created flag:', searchValue);
      onSearchChange(searchValue);
    }
    
    // Mapping mode confirmation toast disabled; UI transition provides affordance
  };

  // Save status indicator component
  const SaveStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    switch (status) {
      case 'saving':
        return <Text fontSize="fontSizeS" fontColor="gray500">Saving...</Text>;
      case 'saved':
        return <Text fontSize="fontSizeS" fontColor="green500">Saved</Text>;
      case 'error':
        return <Text fontSize="fontSizeS" fontColor="red500">Save failed</Text>;
      default:
        return null;
    }
  };

  return (
    <Card padding="default">
      <Box paddingLeft="spacingM" paddingRight="spacingM">
        <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
          <Heading>
            {formState.mode === 'new' ? 'Create Flag Details' : 'Select Existing Flag'}
          </Heading>
          <SaveStatusIndicator status={saveStatus} />
        </Flex>

        {/* Existing Flag Mode / Content Mapping Mode */}
        {formState.mode === 'existing' && (
          <div>
            {/* Existing flag selection */}
            <div style={{ marginBottom: '24px' }}>
              <FormControl>
                <Flex alignItems="center" gap="spacingXs">
                  <FormControl.Label>Select Flag</FormControl.Label>
                  <Tooltip content="Search and choose an existing LaunchDarkly feature flag to link">
                    <InfoCircleIcon variant="secondary" size="tiny" />
                  </Tooltip>
                </Flex>
                <Autocomplete
                  id="flag-autocomplete"
                  items={filteredFlags}
                  onInputValueChange={handleSearchChange}
                  onSelectItem={handleExistingFlagSelect}
                  itemToString={(item) => (item ? `${item.name} (${item.key})` : '')}
                  isLoading={flagsLoading}
                  listMaxHeight={240}
                  usePortal
                  renderItem={(item) => item ? (
                    <Stack spacing="spacingXs">
                      <Text fontWeight="fontWeightMedium">{item.name}</Text>
                      <Text fontColor="gray600" fontSize="fontSizeS">({item.key})</Text>
                    </Stack>
                  ) : null}
                  inputValue={search}
                  selectedItem={launchDarklyFlags.find(flag => flag.key === formState.key) || undefined}
                  placeholder="Search by name or key..."
                />
              </FormControl>
            </div>

            {/* Show content mapping only after flag is selected */}
            {formState.key && (
              <div style={{ marginTop: '24px', borderTop: '1px solid #e5e8ed', paddingTop: '24px' }}>
                <Heading as="h3" marginBottom="spacingM">Map Content to Variations</Heading>
                <VariationContentSection
                  variations={formState.variations}
                  enhancedVariationContent={enhancedVariationContent}
                  onSelectContent={handleSelectVariationContent}
                  onEditEntry={handleEditEntry}
                  onRemoveContent={handleRemoveVariationContent}
                />
              </div>
            )}
          </div>
        )}

        {/* New Flag Mode */}
        {formState.mode === 'new' && (
          <Form>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              width: '100%'
            }}>
              {/* Creation errors will be shown below the Variations section for visibility */}
              {formState.projectKey && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '4px'
                }}>
                  <Text fontSize="fontSizeS" fontColor="gray600">
                    Creating flag in project: <strong>{formState.projectKey}</strong> (configured in app settings)
                  </Text>
                </div>
              )}
              
              <div style={{ width: '100%' }}>
                <FormControl isRequired isInvalid={!!validationErrors.name}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    width: '100%'
                  }}>
                    <Flex alignItems="center" gap="spacingXs">
                      <FormControl.Label>Flag Name</FormControl.Label>
                      <Tooltip content="The human-readable name of your feature flag as it will appear in LaunchDarkly">
                        <InfoCircleIcon variant="secondary" size="tiny" />
                      </Tooltip>
                    </Flex>
                    <Tooltip 
                      content={flagCreated ? "Flag name cannot be changed after creation. You can modify it in LaunchDarkly directly." : "The human-readable name of your feature flag as it will appear in LaunchDarkly"}
                      isVisible={flagCreated}
                    >
                      <TextInput
                        value={formState.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="My New Feature"
                        style={{ width: '100%' }}
                        isDisabled={flagCreated}
                      />
                    </Tooltip>
                    {validationErrors.name && (
                      <FormControl.ValidationMessage>{validationErrors.name}</FormControl.ValidationMessage>
                    )}
                  </div>
                </FormControl>
              </div>

              <div style={{ width: '100%' }}>
                <FormControl isRequired isInvalid={!!validationErrors.key}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    width: '100%'
                  }}>
                    <Flex alignItems="center" gap="spacingXs">
                      <FormControl.Label>Flag Key</FormControl.Label>
                      <Tooltip content="The unique identifier for this flag in your code">
                        <InfoCircleIcon variant="secondary" size="tiny" />
                      </Tooltip>
                    </Flex>
                    <Tooltip 
                      content={flagCreated ? "Flag key cannot be changed after creation. You can modify it in LaunchDarkly directly." : "The unique identifier for this flag in your code"}
                      isVisible={flagCreated}
                    >
                      <TextInput
                        value={formState.key}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        placeholder="my-new-feature"
                        style={{ width: '100%' }}
                        isDisabled={flagCreated}
                      />
                    </Tooltip>
                    {validationErrors.key && (
                      <FormControl.ValidationMessage>{validationErrors.key}</FormControl.ValidationMessage>
                    )}
                  </div>
                </FormControl>
              </div>

              <div style={{ width: '100%' }}>
                <FormControl>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    width: '100%'
                  }}>
                    <Flex alignItems="center" gap="spacingXs">
                      <FormControl.Label>Description</FormControl.Label>
                      <Tooltip content="A detailed explanation of what this feature flag controls">
                        <InfoCircleIcon variant="secondary" size="tiny" />
                      </Tooltip>
                    </Flex>
                    <Tooltip 
                      content={flagCreated ? "Flag description cannot be changed after creation. You can modify it in LaunchDarkly directly." : "A detailed explanation of what this feature flag controls"}
                      isVisible={flagCreated}
                    >
                      <Textarea
                        value={formState.description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        rows={3}
                        placeholder="Describe what this flag controls..."
                        style={{ width: '100%' }}
                        isDisabled={flagCreated}
                      />
                    </Tooltip>
                    {validationErrors.description && (
                      <FormControl.ValidationMessage>{validationErrors.description}</FormControl.ValidationMessage>
                    )}
                  </div>
                </FormControl>
              </div>

              {/* Variations Form for create mode */}
              {formState.name && formState.key && !flagCreated && (
                <div style={{ width: '100%' }}>
                  <Heading as="h3" marginBottom="spacingM">Flag Variations</Heading>
                  <VariationsForm
                    formState={formState}
                    onFormChange={onFormChange}
                    validationErrors={validationErrors}
                    isEditingEnabled={!flagCreationLoading}
                  />
                  {creationError && (
                    <Note variant="negative" style={{ marginTop: '12px', whiteSpace: 'pre-line' }}>
                      {creationError}
                    </Note>
                  )}
                </div>
              )}

              {/* Create Flag Button */}
              {formState.name && formState.key && formState.variations.length >= 2 && !flagCreated && (
                <Flex justifyContent="flex-end" marginTop="spacingL">
                  <Button
                    variant="primary"
                    onClick={handleCreateFlag}
                    isLoading={flagCreationLoading}
                    isDisabled={flagCreationLoading}
                  >
                    {flagCreationLoading ? 'Creating Flag...' : 'Create Flag in LaunchDarkly'}
                  </Button>
                </Flex>
              )}

              {/* Flag created success message with next steps */}
              {flagCreated && (
                <Card padding="default" style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}>
                  <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start" marginBottom="spacingS">
                    <Stack spacing="spacingS" alignItems="flex-start" flexDirection="column" marginBottom="spacingS">
                      <Note variant="positive">
                        🎉 Flag &quot;{formState.name}&quot; created successfully in LaunchDarkly!
                      </Note>
                      
                      <Text>
                        Your flag is now live in LaunchDarkly but <strong>turned off by default</strong> in all environments. 
                        To use this flag with Contentful, you can now map content to its variations. You can change the flag name and key <strong>in LaunchDarkly</strong> if needed.
                        {/* FUTURE: Environment-specific content mappings and targeting will be supported */}
                      </Text>
                    </Stack>
                    
                    <Stack spacing="spacingM">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Use the configured environment for LaunchDarkly URL generation
                          // FUTURE: This will support multi-environment features like environment-specific targeting
                          const envKey = configuredEnvironment || 'production';
                          const targetUrl = `https://app.launchdarkly.com/projects/${configuredProjectKey}/flags/${formState.key}/targeting?env=${envKey}&selected-env=${envKey}`;
                          const loginUrl = `https://app.launchdarkly.com/login?redirect=${encodeURIComponent(targetUrl)}`;
                          window.open(loginUrl, '_blank');
                        }}
                      >
                        View in LaunchDarkly
                      </Button>
                      
                      <Button
                        variant="primary"
                        onClick={handleStartContentMapping}
                      >
                        Start Content Mapping →
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              )}
            </div>
          </Form>
        )}
      </Box>


    </Card>
  );
}; 