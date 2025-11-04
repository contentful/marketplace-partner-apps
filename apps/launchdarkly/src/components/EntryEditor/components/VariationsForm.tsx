import React, { useEffect } from 'react';
import { Button, Stack, FormControl, TextInput, Textarea, IconButton, Note, Flex, Select, Text } from '@contentful/f36-components';
import { PlusIcon, DeleteIcon } from '@contentful/f36-icons';
import { VariationType } from '../../../types/launchdarkly';
import { FlagFormState } from '../types';

interface VariationsFormProps {
  formState: FlagFormState;
  onFormChange: (field: keyof FlagFormState, value: any) => void;
  validationErrors: Record<string, string>;
  isEditingEnabled?: boolean;
}

export const VariationsForm: React.FC<VariationsFormProps> = ({
  formState,
  onFormChange,
  validationErrors,
  isEditingEnabled = true
}) => {
  useEffect(() => {
    // Ensure we always have at least two variations
    if (formState.variations.length < 2) {
      const defaultVariations = formState.variationType === 'boolean' ? [
        {
          name: 'True',
          value: true
        },
        {
          name: 'False',
          value: false
        }
      ] : [
        {
          name: 'Variation 1',
          value: getDefaultValue(formState.variationType)
        },
        {
          name: 'Variation 2',
          value: getDefaultValue(formState.variationType)
        }
      ];
      onFormChange('variations', defaultVariations);
    }
  }, [formState.variationType, formState.variations.length, onFormChange]);

  const handleVariationTypeChange = (newType: VariationType) => {
    // Always create at least two variations when type changes
    const defaultVariations = newType === 'boolean' ? [
      {
        name: 'True',
        value: true
      },
      {
        name: 'False',
        value: false
      }
    ] : [
      {
        name: 'Variation 1',
        value: getDefaultValue(newType)
      },
      {
        name: 'Variation 2',
        value: getDefaultValue(newType)
      }
    ];
    onFormChange('variationType', newType);
    onFormChange('variations', defaultVariations);
  };

  const handleVariationChange = (index: number, field: 'name' | 'value', value: any) => {
    const newVariations = [...formState.variations];
    let processedValue = value;

    // For boolean type, only allow name changes
    if (formState.variationType === 'boolean' && field === 'value') {
      return; // Don't allow value changes for boolean type
    }

    // Validate and process value based on type
    if (field === 'value') {
      switch (formState.variationType) {
        case 'number':
          processedValue = Number(value);
          if (isNaN(processedValue)) {
            return; // Don't update if invalid number
          }
          break;
        case 'boolean':
          processedValue = value === 'true';
          break;
        case 'json':
          try {
            processedValue = JSON.parse(value);
          } catch (e) {
            return; // Don't update if invalid JSON
          }
          break;
        default:
          processedValue = value;
      }
    }

    newVariations[index] = {
      ...newVariations[index],
      [field]: processedValue
    };
    onFormChange('variations', newVariations);
  };

  const handleAddVariation = () => {
    const newVariations = [...formState.variations];
    newVariations.push({
      name: `Variation ${newVariations.length + 1}`,
      value: getDefaultValue(formState.variationType)
    });
    onFormChange('variations', newVariations);
  };

  const handleRemoveVariation = (index: number) => {
    // Don't allow removing variations if it would result in fewer than 2 variations
    if (formState.variations.length <= 2) {
      return;
    }
    const newVariations = formState.variations.filter((_: any, i: number) => i !== index);
    onFormChange('variations', newVariations);
  };

  const getDefaultValue = (type: VariationType): any => {
    switch (type) {
      case 'boolean':
        return true;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return {};
      default:
        return null;
    }
  };

  return (
    <>
      <FormControl marginBottom="spacingL">
        <FormControl.Label>Variation Type</FormControl.Label>
        <Select
          value={formState.variationType}
          onChange={(e) => handleVariationTypeChange(e.target.value as VariationType)}
          isDisabled={!isEditingEnabled}
        >
          <Select.Option value="boolean">Boolean</Select.Option>
          <Select.Option value="string">String</Select.Option>
          <Select.Option value="number">Number</Select.Option>
          <Select.Option value="json">JSON</Select.Option>
        </Select>
      </FormControl>
      
      {validationErrors.variations && (
        <Note variant="negative" style={{ marginBottom: '12px' }}>
          {validationErrors.variations}
        </Note>
      )}
      
      <Stack spacing="spacingL" flexDirection="column" alignItems="stretch">
        {formState.variations.map((variation: any, index: number) => (
            <div key={index} style={{ 
              padding: '16px', 
              backgroundColor: '#fafbfc', 
              border: '1px solid #e5e8ed',
              borderRadius: '4px'
            }}>
             <Stack spacing="spacingM" alignItems="center">
               <Flex justifyContent="space-between" alignItems="center">
                 <Text fontWeight="fontWeightMedium">Variation {index + 1}</Text>
                {/* Remove button - only show if more than 2 variations */}
                {formState.variations.length > 2 && isEditingEnabled && (
                  <IconButton
                    variant="transparent"
                    aria-label="Remove variation"
                    icon={<DeleteIcon />}
                    onClick={() => handleRemoveVariation(index)}
                  />
                )}
              </Flex>
              
              <FormControl>
                <FormControl.Label>Name</FormControl.Label>
                <TextInput
                  value={variation.name}
                  onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                  isDisabled={!isEditingEnabled}
                  placeholder="Variation name"
                />
                {validationErrors[`variation_${index}_name`] && (
                  <FormControl.ValidationMessage>
                    {validationErrors[`variation_${index}_name`]}
                  </FormControl.ValidationMessage>
                )}
              </FormControl>

              <FormControl>
                <FormControl.Label>Value</FormControl.Label>
                {formState.variationType === 'json' ? (
                  <Textarea
                    value={JSON.stringify(variation.value, null, 2)}
                    onChange={(e) => handleVariationChange(index, 'value', e.target.value)}
                    rows={3}
                    isDisabled={!isEditingEnabled}
                    placeholder="JSON value"
                  />
                ) : formState.variationType === 'boolean' ? (
                  <TextInput
                    value={String(variation.value)}
                    isDisabled={true}
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                ) : (
                  <TextInput
                    value={String(variation.value)}
                    onChange={(e) => handleVariationChange(index, 'value', e.target.value)}
                    isDisabled={!isEditingEnabled}
                    placeholder={`${formState.variationType} value`}
                    type={formState.variationType === 'number' ? 'number' : 'text'}
                  />
                )}
                {validationErrors[`variation_${index}_value`] && (
                  <FormControl.ValidationMessage>
                    {validationErrors[`variation_${index}_value`]}
                  </FormControl.ValidationMessage>
                )}
              </FormControl>
            </Stack>
          </div>
        ))}
      </Stack>

      {/* Add variation button */}
      {isEditingEnabled && formState.variationType !== 'boolean' && (
        <Button
          variant="secondary"
          size="small"
          startIcon={<PlusIcon />}
          onClick={handleAddVariation}
          style={{ marginTop: '16px' }}
        >
          Add Variation
        </Button>
      )}

      {formState.variationType === 'boolean' && (
        <Note variant="primary" style={{ marginTop: '16px' }}>
          Boolean flags always have exactly two variations: True and False
        </Note>
      )}
    </>
  );
}; 