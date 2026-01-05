import { useState, useEffect, useRef } from 'react';
import { FlagFormState } from '../components/EntryEditor/types';
import { VariationValue } from '../types/launchdarkly';

export function useUnsavedChanges(formState: FlagFormState) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<FlagFormState | null>(null);
  const isInitialLoad = useRef(true);

  // Reset tracking state when form state is empty (like after mode changes)
  useEffect(() => {
    if (isEmptyFormState(formState)) {
      setLastSavedState(formState);
      setHasUnsavedChanges(false);
      isInitialLoad.current = false;
    }
  }, [formState]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    // Always capture the initial state without marking changes
    if (isInitialLoad.current) {
      setLastSavedState(formState);
      isInitialLoad.current = false;
      return;
    }

    // Skip comparison if we don't have a last saved state
    if (!lastSavedState) {
      setLastSavedState(formState);
      return;
    }

    // Compare current state with last saved state
    const hasChanges = hasFormStateChanged(lastSavedState, formState);
    setHasUnsavedChanges(hasChanges);
  }, [formState, lastSavedState]);

  const markAsSaved = () => {
    setLastSavedState(formState);
    setHasUnsavedChanges(false);
  };

  const resetLastSavedState = () => {
    setLastSavedState(formState);
    setHasUnsavedChanges(false);
  };

  return { hasUnsavedChanges, markAsSaved, resetLastSavedState };
}

// Helper function to check if form state is empty
function isEmptyFormState(state: FlagFormState): boolean {
  return !state.name && !state.key && !state.description && state.variations.length === 0;
}

// Helper function to compare variations
const hasVariationsChanged = (oldVars: Array<{ value: VariationValue; name: string }>, newVars: Array<{ value: VariationValue; name: string }>): boolean => {
  if (oldVars.length !== newVars.length) return true;
  
  const isBooleanDefault = (vars: Array<{ value: VariationValue; name: string }>) =>
    vars.length === 2 && 
    vars[0]?.name === 'True' && vars[0]?.value === true &&
    vars[1]?.name === 'False' && vars[1]?.value === false;

  // Special case for boolean defaults - don't track changes
  if (isBooleanDefault(oldVars) && isBooleanDefault(newVars)) {
    return false;
  }

  return oldVars.some((oldVar, index) => {
    const newVar = newVars[index];
    return !newVar || oldVar.name !== newVar.name || oldVar.value !== newVar.value;
  });
};

// Helper function to compare values with proper type checking
const hasValueChanged = (oldVal: unknown, newVal: unknown, fieldName: string): boolean => {
  // Special handling for certain fields
  if (fieldName === 'mode' && oldVal === null && newVal === null) {
    return false; // Both null modes are considered equal
  }
  
  return oldVal !== newVal;
};

// Helper function to check if form state has changed
function hasFormStateChanged(oldState: FlagFormState, newState: FlagFormState): boolean {
  // Check if any significant field has changed
  const fieldsToCheck: (keyof FlagFormState)[] = [
    'name', 'key', 'description', 'variations', 'mode', 'variationType'
  ];

  return fieldsToCheck.some(field => {
    const oldValue = oldState[field];
    const newValue = newState[field];
    
    if (field === 'variations') {
      return hasVariationsChanged(oldValue as Array<{ value: VariationValue; name: string }>, newValue as Array<{ value: VariationValue; name: string }>);
    }
    
    return hasValueChanged(oldValue, newValue, field);
  });
} 