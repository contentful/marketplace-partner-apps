import { CreateFlagData, VariationType } from '../types/launchdarkly';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateFlagData(data: CreateFlagData): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Flag name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Flag name must be less than 100 characters';
  }

  // Validate key
  if (!data.key || data.key.trim().length === 0) {
    errors.key = 'Flag key is required';
  } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]*$/.test(data.key)) {
    errors.key = 'Flag key can only contain letters, numbers, underscores, hyphens, and periods, and must start with a letter or number';
  } else if (data.key.length > 100) {
    errors.key = 'Flag key must be less than 100 characters';
  }

  // Validate variations
  if (!data.variations || data.variations.length === 0) {
    errors.variations = 'At least one variation is required';
  } else if (data.variations.length < 2) {
    errors.variations = 'At least two variations are required';
  } else {
    // Validate each variation
    data.variations.forEach((variation, index) => {
      if (!variation.name || variation.name.trim().length === 0) {
        errors[`variation_${index}_name`] = `Variation ${index + 1} name is required`;
      }
      if (!validateVariationValue(variation.value, data.kind)) {
        errors[`variation_${index}_value`] = `Variation ${index + 1} value is invalid for type ${data.kind}`;
      }
    });

    // Ensure all variation names are distinct
    const names = data.variations.map(v => (v.name || '').trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      errors.variations = 'Variation names must all be distinct';
    }

    // Ensure all variation values are distinct for the given kind
    const serialize = (val: unknown) => {
      if (val === null || val === undefined) return String(val);
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };
    const values = data.variations.map(v => serialize(v.value));
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      errors.variations = 'Variation values must all be distinct';
    }
  }

  // Validate description length
  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }



  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateVariationValue(value: any, type: VariationType): boolean {
  switch (type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'json':
      try {
        if (typeof value === 'object') return true;
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function validateProjectKey(projectKey: string): string | null {
  if (!projectKey || typeof projectKey !== 'string') {
    return 'Project key is required';
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(projectKey)) {
    return 'Project key can only contain letters, numbers, underscores, hyphens, and periods';
  }
  return null;
}

export function sanitizeFlagKey(input: string): string {
  // Convert to lowercase and replace spaces with hyphens
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_.]/g, '')
    .replace(/^[^a-zA-Z0-9]+/, '') // Remove non-alphanumeric characters from start
    .substring(0, 100); // Limit length
} 