/**
 * Field Check Dialog — Cortex multi-agent scan flow.
 *
 * Submits content to the Cortex parallel executor with the user's selected agents,
 * streams agent_result events via SSE, and renders Cortex issues in a split-pane UI.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useAutoResizer, useSDK } from "@contentful/react-apps-toolkit";
import { Button, Heading } from "@contentful/f36-components";
import { CheckCircleIcon, CopySimpleIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import type { Document } from "@contentful/rich-text-types";
import SignInCard from "../../components/UserSettings/SignInCard";
import { useAuth } from "../../contexts/AuthContext";
import { useAgenticScan } from "../../hooks/useAgenticScan";
import { useAgentSelection } from "../../hooks/useAgentSelection";
import { useAgentConfig } from "../../hooks/useAgentConfig";
import { useStyleGuides } from "../../hooks/useStyleGuides";
import { useEffectiveStyleGuide } from "../../hooks/useEffectiveStyleGuide";
import { useAgentAvailability } from "../../hooks/useAgentAvailability";
import { getUserSettings } from "../../utils/userSettings";
import { toBackendAgentIds } from "../../agents/agenticConfig";
import { filterRunnableAgentIds, unavailabilityReasonsFor } from "../../agents/agentAvailability";
import type { CortexIssueWithId, CortexSeverity } from "../../agents/types";
import { getAgenticSuggestionChoices } from "../../agents/utils/agenticSuggestions";
import { buildDocumentRef, extensionForFieldAndContent } from "../../agents/utils/documentMeta";
import {
  buildStyleAgentApplyAllPeerCountByIssueId,
  getStyleAgentApplyAllClusterKey,
  styleAgentIssueAcceptsSuggestion,
} from "../../agents/utils/styleAgentApplyAllCluster";
import { EditorPanel } from "./FieldCheck/components/EditorPanel";
import {
  SuggestionsSidebar,
  type SidebarViewMode,
} from "./FieldCheck/components/SuggestionsSidebar";
import { AgentSettingsPanel } from "./FieldCheck/components/AgentSettingsPanel";
import { AboutView } from "../../components/About/AboutView";
import type { IssueSourceFormat } from "./FieldCheck/components/IssueHighlights/types";
import type { FieldCheckDialogParams } from "./dialogTypes";
import type { AppInstallationParameters } from "../../types/appConfig";
import {
  convertHtmlToRichText,
  convertRichTextToHtml,
  isRichTextDocument,
  type TextNodeWithId,
} from "../../utils/richTextUtils";
import { detectSyntaxKind } from "./FieldCheck/utils";
import { getApiErrorMessage } from "../../utils/errorMessage";

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

const EditorContentWrap = styled.div`
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

function inferSourceFormat(isRichText: boolean, content: string): IssueSourceFormat {
  if (isRichText) return "html";
  const syntax = detectSyntaxKind(content);
  if (syntax === "html" || syntax === "xml") return "html";
  if (syntax === "markdown") return "markdown";
  return "plain";
}

const FieldCheckDialog: React.FC = () => {
  useAutoResizer();
  const sdk = useSDK<DialogAppSDK>();
  const params = sdk.parameters.invocation as unknown as FieldCheckDialogParams;
  const { isAuthenticated, token } = useAuth();
  const editorContentRef = useRef<(() => string) | null>(null);
  const applyIssueRef = useRef<((index: number, replacement?: string) => void) | null>(null);
  const applyIssuesRef = useRef<((indices: number[], replacement: string) => void) | null>(null);
  const lastAppliedFilteredPosition = useRef<number>(-1);
  const filteredIssuesRef = useRef<CortexIssueWithId[]>([]);
  const issueToOriginalIndexRef = useRef<Map<CortexIssueWithId, number>>(new Map());

  const [appliedCount, setAppliedCount] = useState(0);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());
  const [exitingIndices, setExitingIndices] = useState<Set<number>>(new Set());
  const [scanId, setScanId] = useState(0);
  const [hasRunInitialScan, setHasRunInitialScan] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [workflowIdCopied, setWorkflowIdCopied] = useState(false);
  const [sidebarView, setSidebarView] = useState<"main" | "settings" | "about">("main");
  const [selectedAgentFilterIds, setSelectedAgentFilterIds] = useState<Set<string> | null>(null);
  const [viewMode, setViewMode] = useState<SidebarViewMode>("grouped");
  const [selectedSeverities, setSelectedSeverities] = useState<Set<CortexSeverity>>(
    () => new Set(),
  );

  const isRichText = params.fieldFormat === "RichText";
  const originalRichTextDoc = useRef<Document | null>(null);
  const richTextNodeMap = useRef<Map<string, TextNodeWithId>>(new Map());

  const initialEditorContent = useMemo(() => {
    if (isRichText && isRichTextDocument(params.fieldContent)) {
      originalRichTextDoc.current = params.fieldContent;
      const { html, nodeMap } = convertRichTextToHtml(params.fieldContent);
      richTextNodeMap.current = nodeMap;
      return html;
    }
    return typeof params.fieldContent === "string" ? params.fieldContent : "";
  }, [isRichText, params.fieldContent]);

  /**
   * Content actually submitted to Cortex for the latest scan. Issue offsets are
   * in this string's coordinate space, so the offset mapper must use it (not
   * `initialEditorContent`, which would diverge once the user edits the field).
   */
  const [scannedContent, setScannedContent] = useState<string>(initialEditorContent);

  const sourceFormat: IssueSourceFormat = useMemo(
    () => inferSourceFormat(isRichText, scannedContent),
    [isRichText, scannedContent],
  );

  useEffect(() => {
    sdk.window.updateHeight();
    requestAnimationFrame(() => {
      sdk.window.updateHeight();
    });
  }, [sdk.window]);

  const apiKey = token ?? getUserSettings().apiKey;
  const { selectedAgentIds, toggleAgent } = useAgentSelection();
  const { agentConfig, setAgentConfigKey, flattenConfigForRequest } = useAgentConfig();
  const { unavailable: unavailableAgents } = useAgentAvailability();

  // Single fetch of style guides shared by the sidebar picker (and any
  // future consumer) — react-query also dedupes via query key, but lifting the
  // call here makes it explicit that we never fan out per-component.
  const {
    styleGuides,
    isLoading: styleGuidesLoading,
    isError: styleGuidesError,
    defaultStyleGuideId: defaultStyleGuide,
  } = useStyleGuides(apiKey);

  // Pull the per-content-type default straight from `sdk.parameters.installation`
  // rather than threading it through invocation params — that way every dialog
  // open reads the freshest value Contentful saved on the config screen,
  // independent of how the field iframe constructed the invocation payload.
  // Default to {} so a missing/undefined installation block doesn't throw.
  const installationParams: AppInstallationParameters =
    (sdk.parameters.installation as AppInstallationParameters | undefined) ?? {};
  const contentTypeDefault = installationParams.contentTypeSettings?.[params.contentTypeId];
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const { effectiveStyleGuideId, setFieldStyleGuide } = useEffectiveStyleGuide({
    spaceId,
    environmentId,
    contentTypeId: params.contentTypeId,
    fieldId: params.fieldId,
    contentTypeDefault,
  });

  const { issues, startScan, scanInFlight, workflowId, error: scanError } = useAgenticScan(apiKey);

  /**
   * `style_guide_id` lives in per-field localStorage, but the agent settings
   * panel still needs to render it so users can edit it from either surface. We
   * project the effective value into the panel's view of `agentConfig` and
   * route panel writes through `setFieldStyleGuide`, keeping both pickers in
   * lockstep regardless of which one the user changes.
   */
  const agentConfigForPanel = useMemo<Record<string, Record<string, unknown>>>(() => {
    const existingStyle: Record<string, unknown> = Object.hasOwn(agentConfig, "style_agent")
      ? agentConfig.style_agent
      : {};
    return {
      ...agentConfig,
      style_agent: { ...existingStyle, style_guide_id: effectiveStyleGuideId ?? "" },
    };
  }, [agentConfig, effectiveStyleGuideId]);

  const handleAgentConfigKeyChange = useCallback(
    (agentId: string, key: string, value: unknown) => {
      if (agentId === "style_agent" && key === "style_guide_id") {
        setFieldStyleGuide(typeof value === "string" && value.length > 0 ? value : null);
        return;
      }
      setAgentConfigKey(agentId, key, value);
    },
    [setAgentConfigKey, setFieldStyleGuide],
  );

  const runScan = useCallback(
    async (content: string) => {
      setCheckError(null);
      const backendIds = toBackendAgentIds(selectedAgentIds, unavailableAgents);
      if (backendIds.length === 0) {
        setCheckError("Select at least one agent in settings.");
        return;
      }
      // Flip hasRunScan first so the sidebar stops showing the pristine "READY" state
      // while the scan is in flight. scanId is bumped after the stream completes so
      // the editor's decoration effect picks up the final issues in one pass.
      setHasRunInitialScan(true);
      // Snapshot the content sent to Cortex so the offset mapper can translate
      // returned `position.start` / `position.end` against the exact same string.
      setScannedContent(content);
      try {
        // The picker is the single source of truth for `style_guide_id` when
        // the user (or admin) has picked one. When nothing has been picked we
        // fall back to the org default chosen by `useStyleGuides` (Main →
        // API is_default → first enabled). The backend does not always pick
        // a default when the field is omitted, so always sending one keeps
        // analyses from coming back with `styleGuideDisplayName=null`.
        const finalAgentConfig: Record<string, unknown> = flattenConfigForRequest(selectedAgentIds);
        const resolvedStyleGuideId = effectiveStyleGuideId ?? defaultStyleGuide ?? null;
        if (resolvedStyleGuideId) {
          finalAgentConfig.style_guide_id = resolvedStyleGuideId;
        } else {
          delete finalAgentConfig.style_guide_id;
        }

        // `document_name` carries the entry title (e.g. "My Article"); we
        // also build a unique `document_ref` from title + field id + a file
        // extension derived from the field type, refined by detected syntax
        // so a Symbol that contains markdown still gets `.md`.
        const extension = extensionForFieldAndContent(
          params.fieldFormat,
          detectSyntaxKind(content),
        );
        const documentName = params.entryTitle?.trim() || undefined;
        const documentRef = buildDocumentRef({
          title: documentName,
          fieldId: params.fieldId,
          extension,
        });

        await startScan({
          text: content,
          documentName,
          documentRef,
          backendIds,
          agentConfig: finalAgentConfig,
        });
        setScanId((n) => n + 1);
      } catch (error) {
        console.error("Scan failed:", error);
        setCheckError(getApiErrorMessage(error));
      }
    },
    [
      startScan,
      selectedAgentIds,
      unavailableAgents,
      flattenConfigForRequest,
      params.fieldFormat,
      params.fieldId,
      params.entryTitle,
      effectiveStyleGuideId,
      defaultStyleGuide,
    ],
  );

  useEffect(() => {
    if (scanError) setCheckError(scanError);
  }, [scanError]);

  /**
   * Reason the Check button must stay disabled, or null when ready.
   *
   * Order of checks (first match wins):
   *   1. The user's selection ∩ org-available agents is empty — surface the
   *      org-level reason(s). Today this only fires when style_agent is the
   *      sole selection and the org has it disabled; tomorrow with more
   *      agents it will only fire if *every* selected agent is blocked.
   *   2. style_agent is in the runnable subset but no style guide is
   *      picked — Cortex would fall back to a server-side default or skip
   *      the agent, neither of which matches the user's intent.
   */
  const runnableAgentIds = useMemo(
    () => filterRunnableAgentIds(selectedAgentIds, unavailableAgents),
    [selectedAgentIds, unavailableAgents],
  );

  const checkBlockedReason = useMemo<string | null>(() => {
    if (selectedAgentIds.length > 0 && runnableAgentIds.length === 0) {
      return (
        unavailabilityReasonsFor(selectedAgentIds, unavailableAgents) ??
        "Selected agents are not available."
      );
    }
    if (runnableAgentIds.includes("style_agent") && !effectiveStyleGuideId) {
      return "Pick a style guide before running Check.";
    }
    return null;
  }, [selectedAgentIds, runnableAgentIds, unavailableAgents, effectiveStyleGuideId]);

  // `hasEnabledAgent` is the sidebar's "is the Check button reachable?" flag.
  // We can't substitute `runnableAgentIds.length > 0` here: that filter is
  // by unavailability only, while `toBackendAgentIds` *also* filters by
  // `SELECTABLE_AGENT_BACKEND_IDS`. They produce identical results today
  // (only style_agent has a backend mapping) but a future "selected,
  // available, no backend mapping" agent would diverge — the sidebar would
  // claim "ready" while the scan submits zero agents. Memoizing the call
  // gives us the DRY win without losing the second filter.
  const hasEnabledAgent = useMemo(
    () => toBackendAgentIds(selectedAgentIds, unavailableAgents).length > 0,
    [selectedAgentIds, unavailableAgents],
  );

  const handleCheck = useCallback(async () => {
    if (!editorContentRef.current) return;
    const content = editorContentRef.current();
    if (!content.trim()) return;
    if (checkBlockedReason) {
      setCheckError(checkBlockedReason);
      return;
    }
    setSelectedIssueIndex(null);
    setAppliedCount(0);
    setDismissedIndices(new Set());
    await runScan(content);
  }, [runScan, checkBlockedReason]);

  const handleApplyIssue = useCallback(
    (_issue: CortexIssueWithId, index: number, appliedSuggestion?: string) => {
      const currentFilteredIndex = filteredIssuesRef.current.findIndex(
        (s) => issueToOriginalIndexRef.current.get(s) === index,
      );
      lastAppliedFilteredPosition.current = currentFilteredIndex;
      applyIssueRef.current?.(index, appliedSuggestion);
      setAppliedCount((n) => n + 1);
    },
    [],
  );

  const issuesRef = useRef<CortexIssueWithId[]>([]);

  const handleApplyAllMatching = useCallback(
    (issue: CortexIssueWithId, appliedSuggestion?: string) => {
      const text =
        appliedSuggestion ?? getAgenticSuggestionChoices(issue).at(0) ?? issue.suggestion ?? "";
      if (!text) return;
      const allIssues = issuesRef.current;
      const clusterKey = getStyleAgentApplyAllClusterKey(issue);
      const matches: number[] = [];
      allIssues.forEach((candidate, idx) => {
        if (candidate.agent !== "style_agent") return;
        if (dismissedIndices.has(idx)) return;
        if (getStyleAgentApplyAllClusterKey(candidate) !== clusterKey) return;
        if (!styleAgentIssueAcceptsSuggestion(candidate, text)) return;
        matches.push(idx);
      });
      if (matches.length === 0) return;
      const targetIdx = issuesRef.current.indexOf(issue);
      const currentFilteredIndex =
        targetIdx >= 0
          ? filteredIssuesRef.current.findIndex(
              (s) => issueToOriginalIndexRef.current.get(s) === targetIdx,
            )
          : -1;
      lastAppliedFilteredPosition.current = currentFilteredIndex;
      applyIssuesRef.current?.(matches, text);
      setAppliedCount((n) => n + matches.length);
    },
    [dismissedIndices],
  );

  const handleIssuesRemoved = useCallback((indices: number[]) => {
    const removedSet = new Set(indices);
    const addAll = (prev: Set<number>): Set<number> => {
      const next = new Set(prev);
      indices.forEach((i) => next.add(i));
      return next;
    };
    const removeAll = (prev: Set<number>): Set<number> => {
      const next = new Set(prev);
      indices.forEach((i) => next.delete(i));
      return next;
    };
    setExitingIndices(addAll);
    setTimeout(() => {
      setDismissedIndices(addAll);
      setExitingIndices(removeAll);

      const currentFiltered = filteredIssuesRef.current;
      const indexMap = issueToOriginalIndexRef.current;
      const remaining = currentFiltered.filter((s) => {
        const origIdx = indexMap.get(s);
        return origIdx !== undefined && !removedSet.has(origIdx);
      });

      if (remaining.length === 0) {
        setSelectedIssueIndex(null);
        return;
      }

      const prevPosition = lastAppliedFilteredPosition.current;
      let nextPosition = prevPosition;
      if (nextPosition >= remaining.length || nextPosition < 0) nextPosition = 0;
      const nextIssue = remaining[nextPosition];
      const nextOriginalIndex = indexMap.get(nextIssue);
      if (nextOriginalIndex !== undefined) setSelectedIssueIndex(nextOriginalIndex);
    }, 300);
  }, []);

  const handleDismissIssue = useCallback((_issue: CortexIssueWithId, index: number) => {
    setDismissedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setSelectedIssueIndex(null);
  }, []);

  const handleSelectIssue = useCallback((_issue: CortexIssueWithId | null, index: number) => {
    setSelectedIssueIndex(index >= 0 ? index : null);
  }, []);

  const visibleIssuesWithIndices = useMemo(() => {
    return issues
      .map((s, index) => ({ issue: s, originalIndex: index }))
      .filter(({ originalIndex }) => !dismissedIndices.has(originalIndex));
  }, [issues, dismissedIndices]);

  const visibleIssues = useMemo(
    () => visibleIssuesWithIndices.map(({ issue }) => issue),
    [visibleIssuesWithIndices],
  );

  const issueToOriginalIndex = useMemo(() => {
    const map = new Map<CortexIssueWithId, number>();
    visibleIssuesWithIndices.forEach(({ issue, originalIndex }) => {
      map.set(issue, originalIndex);
    });
    return map;
  }, [visibleIssuesWithIndices]);

  const filteredIssues = useMemo(() => {
    return visibleIssues.filter((s) => {
      const severity = s.severity;
      const agentMatch = selectedAgentFilterIds === null || selectedAgentFilterIds.has(s.agent);
      const severityMatch = selectedSeverities.size === 0 || selectedSeverities.has(severity);
      return agentMatch && severityMatch;
    });
  }, [visibleIssues, selectedAgentFilterIds, selectedSeverities]);

  const sortedFilteredIssues = useMemo(
    () => [...filteredIssues].sort((a, b) => a.position.start - b.position.start),
    [filteredIssues],
  );

  useEffect(() => {
    filteredIssuesRef.current = sortedFilteredIssues;
  }, [sortedFilteredIssues]);

  useEffect(() => {
    issueToOriginalIndexRef.current = issueToOriginalIndex;
  }, [issueToOriginalIndex]);

  useEffect(() => {
    issuesRef.current = issues;
  }, [issues]);

  const styleAgentApplyAllPeerCountByIssueId = useMemo(
    () => buildStyleAgentApplyAllPeerCountByIssueId(visibleIssues),
    [visibleIssues],
  );

  const editorVisibleIndices = useMemo(() => {
    return issues
      .map((s, index) => ({ issue: s, originalIndex: index }))
      .filter(({ issue, originalIndex }) => {
        if (dismissedIndices.has(originalIndex)) return false;
        const severity = issue.severity;
        const agentMatch =
          selectedAgentFilterIds === null || selectedAgentFilterIds.has(issue.agent);
        const severityMatch = selectedSeverities.size === 0 || selectedSeverities.has(severity);
        return agentMatch && severityMatch;
      })
      .map(({ originalIndex }) => originalIndex);
  }, [issues, dismissedIndices, selectedAgentFilterIds, selectedSeverities]);

  const handleClose = useCallback(() => {
    sdk.close();
  }, [sdk]);

  const handleSignOut = useCallback(() => {
    sdk.close();
  }, [sdk]);

  const handleCopyWorkflowId = useCallback(async () => {
    if (!workflowId) return;
    try {
      await navigator.clipboard.writeText(workflowId);
      setWorkflowIdCopied(true);
      setTimeout(() => {
        setWorkflowIdCopied(false);
      }, 1500);
    } catch {
      // clipboard may be unavailable
    }
  }, [workflowId]);

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
          <Heading marginBottom="none">Content Preview</Heading>
          <PreviewSubtitle>
            {hasRunInitialScan
              ? "Click on highlighted text or sidebar cards to view suggestions"
              : "Configure your agents and click Check to analyze this content"}
          </PreviewSubtitle>
        </PreviewHeader>

        <EditorWrapper>
          <EditorContentWrap>
            <EditorPanel
              initialContent={initialEditorContent}
              issues={issues}
              visibleIndices={editorVisibleIndices}
              sourceFormat={sourceFormat}
              sourceText={scannedContent}
              scanId={scanId}
              isBusy={scanInFlight}
              editorContentRef={editorContentRef}
              isRichText={isRichText}
              selectedIssueIndex={selectedIssueIndex}
              onIssueSelect={handleSelectIssue}
              applyIssueRef={applyIssueRef}
              applyIssuesRef={applyIssuesRef}
              onIssuesRemoved={handleIssuesRemoved}
            />
          </EditorContentWrap>

          <DialogFooter>
            <FooterLeftGroup>
              {workflowId && (
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
        {sidebarView === "settings" && (
          <AgentSettingsPanel
            onBack={() => {
              setSidebarView("main");
            }}
            selectedAgentIds={selectedAgentIds}
            toggleAgent={toggleAgent}
            agentConfig={agentConfigForPanel}
            onAgentConfigKeyChange={handleAgentConfigKeyChange}
            apiKey={apiKey}
            styleGuides={styleGuides}
            styleGuidesLoading={styleGuidesLoading}
            styleGuidesError={styleGuidesError}
            unavailableAgents={unavailableAgents}
          />
        )}
        {sidebarView === "about" && (
          <AboutView
            onBack={() => {
              setSidebarView("main");
            }}
          />
        )}
        {sidebarView === "main" && (
          <SuggestionsSidebar
            issues={visibleIssues}
            filteredIssues={filteredIssues}
            issueToOriginalIndex={issueToOriginalIndex}
            exitingIndices={exitingIndices}
            isLoading={scanInFlight}
            hasRunScan={hasRunInitialScan}
            hasEnabledAgent={hasEnabledAgent}
            checkError={checkError}
            onDismissCheckError={() => {
              setCheckError(null);
            }}
            onCheck={() => {
              void handleCheck();
            }}
            onOpenAgentSettings={() => {
              setSidebarView("settings");
            }}
            onOpenAbout={() => {
              setSidebarView("about");
            }}
            onApplyIssue={handleApplyIssue}
            onApplyAllMatching={handleApplyAllMatching}
            onDismissIssue={handleDismissIssue}
            onSelectIssue={handleSelectIssue}
            selectedIssueIndex={selectedIssueIndex}
            selectedSeverities={selectedSeverities}
            onSeverityChange={setSelectedSeverities}
            selectedAgentFilterIds={selectedAgentFilterIds}
            onAgentFilterChange={setSelectedAgentFilterIds}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            styleAgentApplyAllPeerCountByIssueId={styleAgentApplyAllPeerCountByIssueId}
            onSignOut={handleSignOut}
            totalIssueCount={issues.length}
            appliedCount={appliedCount}
            dismissedCount={dismissedIndices.size - appliedCount}
            checkBlockedReason={checkBlockedReason}
          />
        )}
      </SidebarSection>
    </DialogContainer>
  );
};

export default FieldCheckDialog;
