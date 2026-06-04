/**
 * Card for a single Cortex issue. Mirrors sidebar-app's agentic IssueCard:
 * only the category/severity header (and explicit dismiss/suggestion buttons)
 * are interactive — the surrounding card body does NOT toggle expand/collapse.
 *
 * When expanded shows multiple suggestion choices (preferred over single
 * `suggestion`), an optional "Apply to all N occurrences" checkbox for
 * style_agent clusters, an explanation block, and the feedback flow.
 */

import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Button, IconButton, Textarea } from "@contentful/f36-components";
import { CheckCircleIcon, ThumbsDownIcon, ThumbsUpIcon, XIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import tokens from "@contentful/f36-tokens";
import type { CortexIssueWithId, CortexSeverity } from "../../../../../agents/types";
import { getAgentByID, getFallbackAgent } from "../../../../../agents/agents";
import { getAgenticSuggestionChoices } from "../../../../../agents/utils/agenticSuggestions";
import { SEVERITY_COLORS } from "../../../../../utils/scoreColors";
import { SuggestionsCard, SuggestionsCardApplyAllCheckbox } from "./SuggestionsCard";

const slideOutRight = keyframes`
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
`;

const fadeInScale = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

function stripHtmlForDisplay(text: string | null | undefined): string {
  if (!text) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  const textContent = tempDiv.textContent || "";
  return textContent.replaceAll(/\s+/g, " ").trim();
}

const TRUNCATE_THRESHOLD = 80;
const HEAD_CHARS = 40;
const TAIL_CHARS = 30;

/** Mirror sidebar-app's `truncateMiddle`: keep word boundaries on both ends, show head … tail. */
function truncateMiddle(text: string): string {
  if (text.length <= TRUNCATE_THRESHOLD) return text;
  const headBoundary = text.lastIndexOf(" ", HEAD_CHARS);
  const head = text.slice(0, headBoundary > 0 ? headBoundary + 1 : HEAD_CHARS);
  const tailStart = text.indexOf(" ", text.length - TAIL_CHARS);
  const tail = text.slice(tailStart > 0 ? tailStart + 1 : text.length - TAIL_CHARS);
  return `${head.trimEnd()} … ${tail.trimStart()}`;
}

export interface FeedbackPayload {
  helpful: boolean;
  feedbackText: string;
  original: string;
  suggestion: string;
  category: string | null;
}

export interface SuggestionCardProps {
  issue: CortexIssueWithId;
  isExpanded: boolean;
  isExiting?: boolean;
  /** Expand a collapsed card. Single-expanded-at-a-time is enforced upstream. */
  onExpand: () => void;
  /** Apply a chosen suggestion. Defaults to first suggestion when none passed. */
  onApply: (appliedSuggestion?: string) => void;
  onDismiss: () => void;
  onSubmitFeedback?: (payload: FeedbackPayload) => Promise<void>;
  isFeedbackLoading?: boolean;
  /** Active style_agent peers in this card's apply-all cluster (>=2 enables the checkbox). */
  styleAgentApplyAllPeerCount?: number;
  /** Apply this suggestion to every active style_agent peer in the cluster. */
  onApplyAllMatching?: (appliedSuggestion?: string) => void | Promise<void>;
  /** Hide the agent name badge (e.g. in grouped view where the group header already names the agent). */
  hideAgentBadge?: boolean;
}

const CardContainer = styled.div<{ isExpanded: boolean; isExiting?: boolean }>`
  background: ${tokens.colorWhite};
  border: 1px solid ${(p) => (p.isExpanded ? tokens.blue500 : tokens.gray200)};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
  cursor: ${(p) => (p.isExpanded ? "default" : "pointer")};
  flex-shrink: 0;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: ${(p) => (p.isExpanded ? tokens.blue500 : tokens.gray400)};
  }

  ${(p) =>
    p.isExpanded &&
    css`
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `}
  ${(p) =>
    p.isExiting &&
    css`
      animation: ${slideOutRight} 0.3s ease-out forwards;
      pointer-events: none;
    `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  gap: ${tokens.spacingS};
`;

const CardHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
  flex: 1;
  min-width: 0;
`;

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  flex-wrap: wrap;
`;

const CategoryLabel = styled.span`
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
`;

const AgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${tokens.borderRadiusSmall};
  font-size: 10px;
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  background: ${tokens.gray100};
  letter-spacing: 0.3px;
`;

const SeverityBadge = styled.span<{ severity: CortexSeverity }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${tokens.borderRadiusSmall};
  font-size: 10px;
  font-weight: ${tokens.fontWeightDemiBold};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(p) => {
    const c = SEVERITY_COLORS[p.severity];
    return css`
      background: ${c.bg};
      color: ${c.text};
    `;
  }}
`;

const FlaggedText = styled.div`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray800};
  font-weight: ${tokens.fontWeightMedium};
  line-height: 1.4;
  word-break: break-word;
  white-space: normal;
`;

const FieldLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  margin-right: ${tokens.spacingXs};
`;

const ExpandedContent = styled.div`
  padding: 0 ${tokens.spacingM} ${tokens.spacingM};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

const ExplanationBlock = styled.div`
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
  line-height: 1.4;
  word-break: break-word;
`;

const ExplanationLeadIn = styled.span`
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
  margin-right: ${tokens.spacing2Xs};
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FeedbackButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const FeedbackButton = styled.button<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: ${tokens.borderRadiusSmall};
  background: ${(p) => (p.isActive ? tokens.blue100 : "transparent")};
  color: ${(p) => (p.isActive ? tokens.blue600 : tokens.gray500)};
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${tokens.gray100};
    color: ${tokens.gray700};
  }
`;

const FeedbackPanel = styled.div`
  padding-top: ${tokens.spacingS};
  border-top: 1px solid ${tokens.gray200};
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  color: ${tokens.green600};
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  ${css`
    animation: ${fadeInScale} 0.3s ease-out;
  `}

  svg {
    color: ${tokens.green600};
  }
`;

function formatCategory(category: string | null | undefined): string {
  if (!category) return "Issue";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export const SuggestionCard = forwardRef<HTMLDivElement, SuggestionCardProps>(
  (
    {
      issue,
      isExpanded,
      isExiting = false,
      onExpand,
      onApply,
      onDismiss,
      onSubmitFeedback,
      isFeedbackLoading = false,
      styleAgentApplyAllPeerCount,
      onApplyAllMatching,
      hideAgentBadge = false,
    },
    ref,
  ) => {
    const [feedbackType, setFeedbackType] = useState<boolean | null>(null);
    const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [applyAllChecked, setApplyAllChecked] = useState(false);

    const displayOriginal = useMemo(() => {
      const raw = stripHtmlForDisplay(issue.original) || issue.position.sentence || "";
      return truncateMiddle(raw);
    }, [issue.original, issue.position.sentence]);
    const displayExplanation = useMemo(
      () => stripHtmlForDisplay(issue.explanation),
      [issue.explanation],
    );

    const suggestionChoices = useMemo(() => getAgenticSuggestionChoices(issue), [issue]);

    const showApplyAllRow =
      issue.agent === "style_agent" &&
      onApplyAllMatching != null &&
      styleAgentApplyAllPeerCount != null &&
      styleAgentApplyAllPeerCount >= 2;

    const agent = getAgentByID(issue.agent) ?? getFallbackAgent(issue.agent);

    const handleThumbClick = useCallback(
      (helpful: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        if (feedbackType === helpful && showFeedbackPanel) {
          setShowFeedbackPanel(false);
          setFeedbackType(null);
          setFeedbackText("");
          setFeedbackSubmitted(false);
        } else {
          setFeedbackType(helpful);
          setShowFeedbackPanel(true);
          setFeedbackSubmitted(false);
        }
      },
      [feedbackType, showFeedbackPanel],
    );

    const handleSubmitFeedback = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (feedbackType === null || !onSubmitFeedback) return;

        try {
          const fallbackSuggestion = suggestionChoices[0] ?? "";
          await onSubmitFeedback({
            helpful: feedbackType,
            feedbackText,
            original: issue.original,
            suggestion: issue.suggestion ?? fallbackSuggestion,
            category: issue.category ?? null,
          });
          setFeedbackSubmitted(true);
          setFeedbackText("");
        } catch (error) {
          console.error("Failed to submit feedback:", error);
        }
      },
      [feedbackType, feedbackText, onSubmitFeedback, issue, suggestionChoices],
    );

    const handleApplyChoice = useCallback(
      (chosenText: string) => {
        if (showApplyAllRow && applyAllChecked) {
          void Promise.resolve(onApplyAllMatching(chosenText)).catch((err: unknown) => {
            console.error("Apply-all-occurrences failed:", err);
          });
          return;
        }
        onApply(chosenText);
      },
      [showApplyAllRow, applyAllChecked, onApplyAllMatching, onApply],
    );

    const suggestionItems = useMemo(
      () =>
        suggestionChoices.map((text) => ({
          text,
          onApply: () => {
            handleApplyChoice(text);
          },
        })),
      [suggestionChoices, handleApplyChoice],
    );

    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss();
    };

    const handleCardClick = () => {
      if (!isExpanded) onExpand();
    };

    const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isExpanded) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onExpand();
      }
    };

    return (
      <CardContainer
        ref={ref}
        isExpanded={isExpanded}
        isExiting={isExiting}
        onClick={handleCardClick}
        onKeyDown={isExpanded ? undefined : handleCardKeyDown}
        role={isExpanded ? undefined : "button"}
        tabIndex={isExpanded ? undefined : 0}
        aria-expanded={isExpanded ? undefined : false}
        aria-label={isExpanded ? undefined : "Expand issue"}
      >
        <CardHeader>
          <CardHeaderLeft>
            <HeaderMeta>
              <CategoryLabel>{formatCategory(issue.category)}</CategoryLabel>
              {!hideAgentBadge && <AgentBadge title={agent.name}>{agent.name}</AgentBadge>}
              <SeverityBadge severity={issue.severity}>{issue.severity}</SeverityBadge>
            </HeaderMeta>
            <FlaggedText>
              <FieldLabel>Issue:</FieldLabel>
              {displayOriginal}
            </FlaggedText>
          </CardHeaderLeft>
          <IconButton
            aria-label="Dismiss issue"
            icon={<XIcon size="tiny" />}
            variant="transparent"
            size="small"
            onClick={handleDismiss}
          />
        </CardHeader>

        {isExpanded && (
          <ExpandedContent>
            {suggestionItems.length > 0 && (
              <div>
                <SuggestionsCard items={suggestionItems} canInteract />
                {showApplyAllRow && (
                  <SuggestionsCardApplyAllCheckbox
                    canInteract
                    control={{
                      peerCount: styleAgentApplyAllPeerCount,
                      checked: applyAllChecked,
                      onCheckedChange: setApplyAllChecked,
                    }}
                  />
                )}
              </div>
            )}

            {displayExplanation && (
              <ExplanationBlock>
                <ExplanationLeadIn>Why this matters:</ExplanationLeadIn>
                {displayExplanation}
              </ExplanationBlock>
            )}

            <ActionRow>
              <FeedbackButtons>
                <FeedbackButton
                  type="button"
                  isActive={feedbackType === true}
                  onClick={(e) => {
                    handleThumbClick(true, e);
                  }}
                  aria-label="Helpful"
                >
                  <ThumbsUpIcon size="tiny" />
                </FeedbackButton>
                <FeedbackButton
                  type="button"
                  isActive={feedbackType === false}
                  onClick={(e) => {
                    handleThumbClick(false, e);
                  }}
                  aria-label="Not helpful"
                >
                  <ThumbsDownIcon size="tiny" />
                </FeedbackButton>
              </FeedbackButtons>
            </ActionRow>

            {showFeedbackPanel && (
              <FeedbackPanel
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Textarea
                  value={feedbackText}
                  onChange={(e) => {
                    setFeedbackText(e.target.value);
                  }}
                  placeholder="Share your feedback about this suggestion (optional)…"
                  aria-label="Feedback (optional)"
                  rows={3}
                  isDisabled={isFeedbackLoading}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: tokens.spacingS,
                    gap: tokens.spacingS,
                  }}
                >
                  {feedbackSubmitted ? (
                    <SuccessMessage>
                      <CheckCircleIcon size="tiny" />
                      Feedback submitted
                    </SuccessMessage>
                  ) : (
                    <div />
                  )}
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleSubmitFeedback}
                    isDisabled={feedbackType === null || isFeedbackLoading}
                    isLoading={isFeedbackLoading}
                  >
                    Submit
                  </Button>
                </div>
              </FeedbackPanel>
            )}
          </ExpandedContent>
        )}
      </CardContainer>
    );
  },
);

SuggestionCard.displayName = "SuggestionCard";
