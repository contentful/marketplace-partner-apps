import { useCallback, useRef, useEffect } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { DEBOUNCE_DELAY } from '../constants/app';
import { useFieldChecks } from './useFieldChecks';
import { useTimeouts } from './useTimeouts';
import { useFieldSubscriptions } from './useFieldSubscriptions';
import { contentCheck, rewriteContent } from '../services/rewriterService';
import { getUserSettings } from '../utils/userSettings';
import { StyleAnalysisRewriteResp, StyleAnalysisSuccessResp } from '@markupai/toolkit';

// Type guard to check if response is a rewrite response
const isRewriteResponse = (
  response: StyleAnalysisSuccessResp | StyleAnalysisRewriteResp | null,
): response is StyleAnalysisRewriteResp => {
  return response !== null && 'rewrite' in response;
};

export const useRewriter = (sdk: SidebarAppSDK) => {
  const isAcceptingSuggestionRef = useRef(false);
  const onFieldChangeRef = useRef<((fieldId: string) => void) | null>(null);
  const cooldownFieldsRef = useRef<Set<string>>(new Set());
  const COOLDOWN_DURATION = 3000; // 3 seconds

  const { fieldChecks, updateCheck, createCheck, removeCheck, clearChecks } = useFieldChecks();
  const { setTimeout, clearAllTimeouts } = useTimeouts();
  const { setFieldValue } = useFieldSubscriptions(sdk, () => {});

  const handleContentCheck = useCallback(
    async (fieldId: string, content: string) => {
      updateCheck(fieldId, { isChecking: true, error: null });

      const { dialect, tone, styleGuide } = getUserSettings();
      const apiKey = sdk.parameters.installation.apiKey;
      if (!apiKey) {
        updateCheck(fieldId, { isChecking: false });
        return;
      }
      const config = {
        apiKey: apiKey || '',
        dialect: dialect || undefined,
        tone: tone || undefined,
        styleGuide: styleGuide || undefined,
      };

      try {
        const result = await contentCheck(fieldId, content, config);
        updateCheck(fieldId, result);
      } catch (error) {
        console.error('Error checking content:', error);
        updateCheck(fieldId, {
          error: error instanceof Error ? error.message : 'An error occurred while checking content',
        });
      }
    },
    [updateCheck],
  );

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      console.log(
        'field change',
        fieldId,
        'cooldown:',
        cooldownFieldsRef.current.has(fieldId),
        'accepting:',
        isAcceptingSuggestionRef.current,
      );

      // Check if field is in cooldown period
      if (cooldownFieldsRef.current.has(fieldId)) {
        console.log('field in cooldown, ignoring change', fieldId);
        return;
      }

      if (isAcceptingSuggestionRef.current) {
        isAcceptingSuggestionRef.current = false;
        return;
      }

      onFieldChangeRef.current?.(fieldId);
      createCheck(fieldId, value);

      setTimeout(
        fieldId,
        () => {
          handleContentCheck(fieldId, value);
        },
        DEBOUNCE_DELAY,
      );
    },
    [createCheck, handleContentCheck, setTimeout],
  );

  const handleAcceptSuggestion = useCallback(
    async (fieldId: string, rewriteResponseOverride?: StyleAnalysisRewriteResp) => {
      const fieldCheck = fieldChecks[fieldId];
      const rewriteResponse = rewriteResponseOverride || fieldCheck?.checkResponse;
      if (!isRewriteResponse(rewriteResponse) || !rewriteResponse.rewrite) return;

      isAcceptingSuggestionRef.current = true;

      // Add field to cooldown set
      cooldownFieldsRef.current.add(fieldId);

      try {
        await setFieldValue(fieldId, rewriteResponse.rewrite);
        removeCheck(fieldId);

        // Set timeout to remove field from cooldown after COOLDOWN_DURATION
        setTimeout(
          `cooldown-${fieldId}`,
          () => {
            cooldownFieldsRef.current.delete(fieldId);
            // Reset the accepting suggestion flag when cooldown expires
            isAcceptingSuggestionRef.current = false;
          },
          COOLDOWN_DURATION,
        );
      } catch (error) {
        console.error('Error accepting suggestion:', error);
        updateCheck(fieldId, {
          error: error instanceof Error ? error.message : 'An error occurred while accepting suggestion',
        });
        // Remove from cooldown if there was an error
        cooldownFieldsRef.current.delete(fieldId);
        // Reset the accepting suggestion flag on error
        isAcceptingSuggestionRef.current = false;
      }
    },
    [fieldChecks, removeCheck, updateCheck, setFieldValue, setTimeout],
  );

  const handleRewrite = useCallback(
    async (fieldId: string) => {
      const fieldCheck = fieldChecks[fieldId];
      if (!fieldCheck?.checkResponse) return;

      updateCheck(fieldId, { isChecking: true, error: null });

      const { dialect, tone, styleGuide } = getUserSettings();
      const apiKey = sdk.parameters.installation.apiKey;
      if (!apiKey) {
        updateCheck(fieldId, { isChecking: false });
        return;
      }
      const config = {
        apiKey: apiKey || '',
        dialect: dialect || undefined,
        tone: tone || undefined,
        styleGuide: styleGuide || undefined,
      };

      try {
        const result = await rewriteContent(fieldId, fieldCheck.originalValue, config);
        updateCheck(fieldId, result);
      } catch (error) {
        console.error('Error rewriting content:', error);
        updateCheck(fieldId, {
          error: error instanceof Error ? error.message : 'An error occurred while rewriting content',
        });
      }
    },
    [fieldChecks, updateCheck],
  );

  const setOnFieldChange = useCallback((callback: (fieldId: string) => void) => {
    onFieldChangeRef.current = callback;
  }, []);

  useFieldSubscriptions(sdk, handleFieldChange);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearChecks();
      cooldownFieldsRef.current.clear();
    };
  }, [clearAllTimeouts, clearChecks]);

  const clearFieldCooldown = useCallback((fieldId: string) => {
    cooldownFieldsRef.current.delete(fieldId);
    console.log('manually cleared cooldown for field', fieldId);
  }, []);

  const isFieldInCooldown = useCallback((fieldId: string) => {
    return cooldownFieldsRef.current.has(fieldId);
  }, []);

  const resetAcceptingSuggestionFlag = useCallback(() => {
    isAcceptingSuggestionRef.current = false;
    console.log('manually reset accepting suggestion flag');
  }, []);

  return {
    fieldChecks,
    handleAcceptSuggestion,
    clearError: (fieldId: string) => updateCheck(fieldId, { error: null }),
    handleRewrite,
    setOnFieldChange,
    updateCheck,
    clearFieldCooldown,
    isFieldInCooldown,
    resetAcceptingSuggestionFlag,
  };
};
