/**
 * Field Check Dialog - Main component integrating all FieldCheck functionality
 * Redesigned with two-panel layout: Content Preview (left) + Suggestions Sidebar (right)
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK, useAutoResizer } from "@contentful/react-apps-toolkit";
import { Heading, Button } from "@contentful/f36-components";
import { CopySimpleIcon, CheckCircleIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import type { Document } from "@contentful/rich-text-types";
import SignInCard from "../../components/UserSettings/SignInCard";
import { useAuth } from "../../contexts/AuthContext";
import { useSuggestions } from "../../hooks/useSuggestions";
import { useFeedback } from "../../hooks/useFeedback";
import { useUserSettings } from "../../hooks/useUserSettings";
import { useConfigData } from "../../contexts/ConfigDataContext";
import { useFieldCheckState } from "./FieldCheck/hooks";
import { EditorPanel } from "./FieldCheck/components/EditorPanel";
import { SuggestionsSidebar } from "./FieldCheck/components/SuggestionsSidebar";
import { Severity } from "../../api-client/types.gen";
import type { Suggestion, Dialects, Tones } from "../../api-client/types.gen";
import type { FieldCheckDialogParams } from "./dialogTypes";
import {
  isRichTextDocument,
  convertRichTextToHtml,
  convertHtmlToRichText,
  type TextNodeWithId,
} from "../../utils/richTextUtils";
import { FILTER_CATEGORY_IDS } from "./FieldCheck/utils/constants";
import { TONE_NONE } from "../../utils/userSettings";

const DialogContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  max-height: 100vh;
  box-sizing: border-box;
  background: ${tokens.gray100};
  overflow: hidden;
`;

const ContentPreviewSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  padding: ${tokens.spacingM};
  gap: ${tokens.spacingS};
  overflow: hidden;
`;

const DialogFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
  background: ${tokens.gray100};
`;

const FooterLeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const FooterRightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
`;

const WorkflowIdButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing2Xs};
  padding: ${tokens.spacing2Xs} ${tokens.spacingXs};
  background: transparent;
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusSmall};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${tokens.gray100};
    border-color: ${tokens.gray400};
    color: ${tokens.gray700};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PreviewHeader = styled.div`
  flex-shrink: 0;
`;

const PreviewTitle = styled(Heading)`
  margin: 0;
  font-size: ${tokens.fontSizeL};
  color: ${tokens.gray800};
`;

const PreviewSubtitle = styled.p`
  margin: ${tokens.spacingXs} 0 0;
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
`;

const EditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
`;

const EditorContent = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const SidebarSection = styled.div`
  width: 380px;
  flex-shrink: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  padding: ${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingM} 0;
  overflow: hidden;

  @media (max-width: 900px) {
    width: 320px;
  }
`;

// Severity options for filtering (using API enum values)
const SEVERITY_OPTIONS: Severity[] = [Severity.HIGH, Severity.MEDIUM, Severity.LOW];

const FieldCheckDialog: React.FC = () => {
  useAutoResizer();
  const sdk = useSDK<DialogAppSDK>();
  const params = sdk.parameters.invocation as unknown as FieldCheckDialogParams;
  const { isAuthenticated } = useAuth();
  const hasRunCheck = useRef(false);
  const editorContentRef = useRef<(() => string) | null>(null);
  const applySuggestionRef = useRef<((index: number) => void) | null>(null);
  const lastAppliedFilteredPosition = useRef<number>(-1);
  const filteredSuggestionsRef = useRef<Suggestion[]>([]);
  const suggestionToOriginalIndexRef = useRef<Map<Suggestion, number>>(new Map());
  const [appliedCount, setAppliedCount] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());
  const [exitingIndices, setExitingIndices] = useState<Set<number>>(new Set());
  // Check ID increments only when a new check is run - used to tell EditorPanel when to rebuild decorations
  const [checkId, setCheckId] = useState(0);
  // Initial loading state - true from dialog open until first check completes
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Workflow ID copy state
  const [workflowIdCopied, setWorkflowIdCopied] = useState(false);

  // Filter state - lifted to parent so we can sync with EditorPanel
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(FILTER_CATEGORY_IDS),
  );
  const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(
    () => new Set(SEVERITY_OPTIONS),
  );

  // RichText handling - convert Document to HTML for editing
  const isRichText = params.fieldFormat === "RichText";
  const originalRichTextDoc = useRef<Document | null>(null);
  const richTextNodeMap = useRef<Map<string, TextNodeWithId>>(new Map());

  // Compute initial content - for RichText, convert to HTML
  const initialEditorContent = useMemo(() => {
    if (isRichText && isRichTextDocument(params.fieldContent)) {
      originalRichTextDoc.current = params.fieldContent;
      const { html, nodeMap } = convertRichTextToHtml(params.fieldContent);
      richTextNodeMap.current = nodeMap;
      return html;
    }
    // For text fields, content is already a string
    return typeof params.fieldContent === "string" ? params.fieldContent : "";
  }, [isRichText, params.fieldContent]);

  // Ensure we sync the iframe height after first layout
  useEffect(() => {
    sdk.window.updateHeight();
    requestAnimationFrame(() => {
      sdk.window.updateHeight();
    });
  }, [sdk.window]);

  // Get user settings with field context
  const { effectiveSettings, updateDialect, updateTone, updateStyleGuide } = useUserSettings({
    contentTypeId: params.contentTypeId,
    fieldId: params.fieldId,
    contentTypeDefaults: params.contentTypeDefaults,
  });

  // Get constants and style guides from context
  const { constants, styleGuides } = useConfigData();

  // State management
  const {
    setActiveScores,
    activeSuggestions,
    setActiveSuggestions,
    config,
    updateConfig,
    resetAll,
  } = useFieldCheckState();

  // Sync config changes to localStorage
  const handleConfigChange = useCallback(
    (newConfig: Partial<typeof config>) => {
      updateConfig(newConfig);

      if (newConfig.dialect !== undefined) {
        updateDialect(newConfig.dialect);
      }
      if (newConfig.tone !== undefined) {
        updateTone(newConfig.tone || null);
      }
      if (newConfig.styleGuide !== undefined) {
        updateStyleGuide(newConfig.styleGuide || null);
      }
    },
    [updateConfig, updateDialect, updateTone, updateStyleGuide],
  );

  // Helper to convert tone value for API (TONE_NONE -> undefined)
  const getToneForApi = useCallback((tone: string | null | undefined): Tones | undefined => {
    if (!tone || tone === TONE_NONE) {
      return undefined;
    }
    return tone as Tones;
  }, []);

  // Create API config
  const apiConfig = useMemo(
    () => ({
      apiKey: effectiveSettings.apiKey || "",
      dialect: (config.dialect || effectiveSettings.dialect || undefined) as Dialects | undefined,
      tone: getToneForApi(config.tone === undefined ? effectiveSettings.tone : config.tone),
      styleGuide: config.styleGuide || effectiveSettings.styleGuide || undefined,
    }),
    [
      effectiveSettings.apiKey,
      effectiveSettings.dialect,
      effectiveSettings.tone,
      effectiveSettings.styleGuide,
      config.dialect,
      config.tone,
      config.styleGuide,
      getToneForApi,
    ],
  );

  // Initialize config from effectiveSettings
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!constants && !styleGuides) return;

    hasInitialized.current = true;
    updateConfig({
      dialect: effectiveSettings.dialect as Dialects,
      tone: getToneForApi(effectiveSettings.tone),
      styleGuide: effectiveSettings.styleGuide ?? undefined,
    });
  }, [
    constants,
    styleGuides,
    effectiveSettings.dialect,
    effectiveSettings.tone,
    effectiveSettings.styleGuide,
    updateConfig,
    getToneForApi,
  ]);

  // API hooks
  const {
    getSuggestions,
    isPolling: isLoadingSuggestions,
    lastWorkflowId,
  } = useSuggestions(apiConfig);

  // Feedback hook
  const { submitFeedback, isLoading: isFeedbackLoading } = useFeedback(apiConfig);

  // Auto-run suggestions on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated || hasRunCheck.current || !initialEditorContent) return;

    hasRunCheck.current = true;

    void (async () => {
      try {
        const result = await getSuggestions(initialEditorContent, isRichText);
        if (result.original) {
          setActiveScores(result.original.scores ?? null);
          setActiveSuggestions(result.original.issues ?? []);
          // Increment checkId to trigger decoration rebuild in EditorPanel
          setCheckId((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error running initial check:", error);
      } finally {
        // Initial loading complete
        setIsInitialLoading(false);
      }
    })();
  }, [
    isAuthenticated,
    initialEditorContent,
    isRichText,
    getSuggestions,
    setActiveScores,
    setActiveSuggestions,
  ]);

  // Handler functions
  const handleCheck = useCallback(async () => {
    if (!editorContentRef.current) return;

    const content = editorContentRef.current();
    if (!content.trim()) return;

    // Only reset selection, keep everything else as-is until new results arrive
    setSelectedSuggestionIndex(null);

    try {
      const result = await getSuggestions(content, isRichText);
      if (result.original) {
        // Reset all state and update with new results
        resetAll();
        setAppliedCount(0);
        setDismissedIndices(new Set());
        setActiveScores(result.original.scores ?? null);
        setActiveSuggestions(result.original.issues ?? []);
        // Increment checkId to trigger decoration rebuild in EditorPanel
        setCheckId((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error checking content:", error);
    }
  }, [getSuggestions, isRichText, resetAll, setActiveScores, setActiveSuggestions]);

  const handleApplySuggestion = useCallback((suggestion: Suggestion, index: number) => {
    // Find current position in filtered list before applying (using refs to avoid stale closure)
    const currentFilteredIndex = filteredSuggestionsRef.current.findIndex(
      (s) => suggestionToOriginalIndexRef.current.get(s) === index,
    );
    lastAppliedFilteredPosition.current = currentFilteredIndex;

    // Apply the suggestion in the editor
    // The onSuggestionsRemoved callback will handle updating dismissedIndices
    applySuggestionRef.current?.(index);

    // Mark as applied (count increments by 1 for each apply action)
    setAppliedCount((prev) => prev + 1);
    // Don't clear selection here - handleSuggestionsRemoved will auto-select next
  }, []);

  // Callback when suggestions are removed (applied + overlapping)
  // First animate out, then dismiss after animation completes
  const handleSuggestionsRemoved = useCallback((indices: number[]) => {
    const removedSet = new Set(indices);

    // Start exit animation
    setExitingIndices((prev) => {
      const next = new Set(prev);
      indices.forEach((i) => next.add(i));
      return next;
    });

    // After animation (300ms), actually dismiss them and auto-select next card
    setTimeout(() => {
      setDismissedIndices((prev) => {
        const next = new Set(prev);
        indices.forEach((i) => next.add(i));
        return next;
      });
      // Clear exiting state
      setExitingIndices((prev) => {
        const next = new Set(prev);
        indices.forEach((i) => next.delete(i));
        return next;
      });

      // Auto-select the next card
      const currentFiltered = filteredSuggestionsRef.current;
      const indexMap = suggestionToOriginalIndexRef.current;

      // Find remaining suggestions (not in the removed set)
      const remaining = currentFiltered.filter((s) => {
        const origIdx = indexMap.get(s);
        return origIdx !== undefined && !removedSet.has(origIdx);
      });

      if (remaining.length === 0) {
        setSelectedSuggestionIndex(null);
        return;
      }

      // Get the position where we were before applying
      const prevPosition = lastAppliedFilteredPosition.current;

      // If we were at position N, try to select what's now at position N (items shifted up)
      // If N >= remaining length, wrap to first (position 0)
      let nextPosition = prevPosition;
      if (nextPosition >= remaining.length) {
        nextPosition = 0; // Wrap to first card
      }
      if (nextPosition < 0) {
        nextPosition = 0;
      }

      const nextSuggestion = remaining[nextPosition];
      const nextOriginalIndex = indexMap.get(nextSuggestion);

      if (nextOriginalIndex !== undefined) {
        setSelectedSuggestionIndex(nextOriginalIndex);
      }
    }, 300);
  }, []);

  const handleDismissSuggestion = useCallback((suggestion: Suggestion, index: number) => {
    setDismissedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setSelectedSuggestionIndex(null);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: Suggestion | null, index: number) => {
    setSelectedSuggestionIndex(index >= 0 ? index : null);
  }, []);

  // Filter callbacks for SuggestionsSidebar
  const handleCategoryChange = useCallback((categories: Set<string>) => {
    setSelectedCategories(categories);
  }, []);

  const handleSeverityChange = useCallback((severities: Set<Severity>) => {
    setSelectedSeverities(severities);
  }, []);

  // Handle feedback submission
  const handleSubmitFeedback = useCallback(
    async (
      payload: {
        helpful: boolean;
        feedbackText: string;
        original: string;
        suggestion: string;
        category: string | null;
      },
      suggestionIndex: number,
    ) => {
      if (!lastWorkflowId) {
        console.error("No workflow ID available for feedback");
        return;
      }

      await submitFeedback({
        workflowId: lastWorkflowId,
        // Use suggestion index as a unique request identifier within this workflow
        requestId: `suggestion-${String(suggestionIndex)}`,
        helpful: payload.helpful,
        feedback: payload.feedbackText || undefined,
        original: payload.original || undefined,
        suggestion: payload.suggestion || undefined,
        category: payload.category || undefined,
      });
    },
    [lastWorkflowId, submitFeedback],
  );

  // Filter out dismissed suggestions (base list) - keep track of original indices
  const visibleSuggestionsWithIndices = useMemo(() => {
    return activeSuggestions
      .map((s, index) => ({ suggestion: s, originalIndex: index }))
      .filter(({ originalIndex }) => !dismissedIndices.has(originalIndex));
  }, [activeSuggestions, dismissedIndices]);

  const visibleSuggestions = useMemo(() => {
    return visibleSuggestionsWithIndices.map(({ suggestion }) => suggestion);
  }, [visibleSuggestionsWithIndices]);

  // Map from suggestion to its original index in activeSuggestions
  const suggestionToOriginalIndex = useMemo(() => {
    const map = new Map<Suggestion, number>();
    visibleSuggestionsWithIndices.forEach(({ suggestion, originalIndex }) => {
      map.set(suggestion, originalIndex);
    });
    return map;
  }, [visibleSuggestionsWithIndices]);

  // Apply category and severity filters (for sidebar display)
  const filteredSuggestions = useMemo(() => {
    return visibleSuggestions.filter((s) => {
      const category = s.category?.toLowerCase() || "other";
      const severity = s.severity;
      return selectedCategories.has(category) && selectedSeverities.has(severity);
    });
  }, [visibleSuggestions, selectedCategories, selectedSeverities]);

  // Sort filtered suggestions by start offset (matching sidebar display order)
  const sortedFilteredSuggestions = useMemo(() => {
    return [...filteredSuggestions].sort((a, b) => a.position.start_index - b.position.start_index);
  }, [filteredSuggestions]);

  // Keep refs in sync for use in callbacks (use sorted list for correct next-card logic)
  useEffect(() => {
    filteredSuggestionsRef.current = sortedFilteredSuggestions;
  }, [sortedFilteredSuggestions]);

  useEffect(() => {
    suggestionToOriginalIndexRef.current = suggestionToOriginalIndex;
  }, [suggestionToOriginalIndex]);

  // For the editor, we only show suggestions that pass the current filters
  const editorSuggestions = useMemo(() => {
    return activeSuggestions.filter((s, index) => {
      // Skip dismissed
      if (dismissedIndices.has(index)) return false;
      // Apply filters
      const category = s.category?.toLowerCase() || "other";
      const severity = s.severity;
      return selectedCategories.has(category) && selectedSeverities.has(severity);
    });
  }, [activeSuggestions, dismissedIndices, selectedCategories, selectedSeverities]);

  // Define all callbacks before conditional returns to satisfy React hooks rules
  const handleClose = useCallback(() => {
    sdk.close();
  }, [sdk]);

  const handleCopyWorkflowId = useCallback(async () => {
    if (!lastWorkflowId) return;
    try {
      await navigator.clipboard.writeText(lastWorkflowId);
      setWorkflowIdCopied(true);
      setTimeout(() => {
        setWorkflowIdCopied(false);
      }, 1500);
    } catch {
      // Clipboard might be unavailable in some contexts
    }
  }, [lastWorkflowId]);

  const handleSignOut = useCallback(() => {
    sdk.close();
  }, [sdk]);

  const handleAcceptAndSave = useCallback(() => {
    if (editorContentRef.current) {
      const updatedContent = editorContentRef.current();

      if (isRichText && originalRichTextDoc.current) {
        const updatedDoc = convertHtmlToRichText(
          updatedContent,
          originalRichTextDoc.current,
          richTextNodeMap.current,
        );
        sdk.close(updatedDoc);
      } else {
        sdk.close(updatedContent);
      }
    } else {
      sdk.close();
    }
  }, [sdk, isRichText]);

  const hasChanges = appliedCount > 0;

  // Show sign-in card if not authenticated
  if (!isAuthenticated) {
    return (
      <DialogContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <SignInCard />
      </DialogContainer>
    );
  }

  return (
    <DialogContainer>
      <ContentPreviewSection>
        <PreviewHeader>
          <PreviewTitle>Content Preview</PreviewTitle>
          <PreviewSubtitle>
            Click on highlighted text or sidebar cards to view suggestions
          </PreviewSubtitle>
        </PreviewHeader>

        <EditorWrapper>
          <EditorContent>
            <EditorPanel
              initialContent={initialEditorContent}
              suggestions={activeSuggestions}
              visibleIndices={editorSuggestions.map((s) => activeSuggestions.indexOf(s))}
              checkId={checkId}
              isBusy={isInitialLoading || isLoadingSuggestions}
              editorContentRef={editorContentRef}
              isRichText={isRichText}
              selectedSuggestionIndex={selectedSuggestionIndex}
              onSuggestionSelect={handleSelectSuggestion}
              applySuggestionRef={applySuggestionRef}
              onSuggestionsRemoved={handleSuggestionsRemoved}
            />
          </EditorContent>

          <DialogFooter>
            <FooterLeftGroup>
              {lastWorkflowId && (
                <WorkflowIdButton
                  onClick={() => {
                    void handleCopyWorkflowId();
                  }}
                  aria-label="Copy workflow ID"
                  title="Copy workflow ID to clipboard"
                >
                  {workflowIdCopied ? (
                    <CheckCircleIcon size="tiny" />
                  ) : (
                    <CopySimpleIcon size="tiny" />
                  )}
                  Workflow ID
                </WorkflowIdButton>
              )}
            </FooterLeftGroup>
            <FooterRightGroup>
              <Button variant="negative" size="small" onClick={handleClose}>
                Reject and Close
              </Button>
              <Button
                variant="positive"
                size="small"
                onClick={handleAcceptAndSave}
                isDisabled={!hasChanges}
              >
                Accept and Save
              </Button>
            </FooterRightGroup>
          </DialogFooter>
        </EditorWrapper>
      </ContentPreviewSection>

      <SidebarSection>
        <SuggestionsSidebar
          suggestions={visibleSuggestions}
          filteredSuggestions={filteredSuggestions}
          suggestionToOriginalIndex={suggestionToOriginalIndex}
          exitingIndices={exitingIndices}
          isLoading={isInitialLoading || isLoadingSuggestions}
          onCheck={handleCheck}
          onApplySuggestion={handleApplySuggestion}
          onDismissSuggestion={handleDismissSuggestion}
          onSelectSuggestion={handleSelectSuggestion}
          selectedSuggestionIndex={selectedSuggestionIndex}
          selectedCategories={selectedCategories}
          selectedSeverities={selectedSeverities}
          onCategoryChange={handleCategoryChange}
          onSeverityChange={handleSeverityChange}
          config={{
            dialect: config.dialect,
            tone: config.tone,
            styleGuide: config.styleGuide,
          }}
          onConfigChange={handleConfigChange}
          constants={constants}
          styleGuides={styleGuides}
          onSignOut={handleSignOut}
          onSubmitFeedback={handleSubmitFeedback}
          isFeedbackLoading={isFeedbackLoading}
          totalIssueCount={activeSuggestions.length}
          appliedCount={appliedCount}
          dismissedCount={dismissedIndices.size - appliedCount}
        />
      </SidebarSection>
    </DialogContainer>
  );
};

export default FieldCheckDialog;
