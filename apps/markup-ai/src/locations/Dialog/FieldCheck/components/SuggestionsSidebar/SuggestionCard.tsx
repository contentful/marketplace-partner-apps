/**
 * Suggestion card component for the sidebar
 * Shows issue with severity badge, category, and expandable details
 */

import React, { forwardRef, useMemo, useState, useCallback } from "react";
import { Button, IconButton, Textarea } from "@contentful/f36-components";
import {
  XIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
} from "@contentful/f36-icons";
import styled from "@emotion/styled";
import { keyframes, css } from "@emotion/react";
import tokens from "@contentful/f36-tokens";
import { Severity } from "../../../../../api-client/types.gen";
import type { Suggestion } from "../../../../../api-client/types.gen";
import { SEVERITY_COLORS } from "../../../../../utils/scoreColors";

// Slide-out animation for removed cards
const slideOutRight = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

/**
 * Strip HTML tags and decode entities to get human-readable text
 * This is used to display suggestions in the sidebar for rich text content
 */
function stripHtmlForDisplay(text: string | null | undefined): string {
  if (!text) return "";
  // Create a temporary element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  // Get text content (strips all tags)
  const textContent = tempDiv.textContent || tempDiv.innerText || "";
  // Normalize whitespace
  return textContent.replaceAll(/\s+/g, " ").trim();
}

export interface FeedbackPayload {
  helpful: boolean;
  feedbackText: string;
  original: string;
  suggestion: string;
  category: string | null;
}

export interface SuggestionCardProps {
  suggestion: Suggestion;
  isExpanded: boolean;
  isExiting?: boolean;
  onToggle: () => void;
  onApply: () => void;
  onDismiss: () => void;
  onSubmitFeedback?: (payload: FeedbackPayload) => Promise<void>;
  isFeedbackLoading?: boolean;
}

const CardContainer = styled.div<{ isExpanded: boolean; isExiting?: boolean }>`
  background: ${tokens.colorWhite};
  border: 1px solid ${(props) => (props.isExpanded ? tokens.blue500 : tokens.gray200)};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: ${(props) => (props.isExpanded ? tokens.blue500 : tokens.gray400)};
  }

  ${(props) =>
    props.isExpanded &&
    `
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  `}

  ${(props) =>
    props.isExiting &&
    `
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

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
`;

const CategoryLabel = styled.span`
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
`;

const SubcategoryLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
  font-weight: ${tokens.fontWeightNormal};
`;

const CategoryArrow = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  vertical-align: middle;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const FieldLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  margin-right: ${tokens.spacingXs};
`;

const SeverityBadge = styled.span<{ severity: Severity }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${tokens.borderRadiusSmall};
  font-size: 10px;
  font-weight: ${tokens.fontWeightDemiBold};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    const colors = SEVERITY_COLORS[props.severity];
    return `
      background: ${colors.bg};
      color: ${colors.text};
    `;
  }}
`;

const IssueText = styled.div<{ isTruncated?: boolean }>`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray800};
  font-weight: ${tokens.fontWeightMedium};
  line-height: 1.4;

  ${(props) =>
    props.isTruncated &&
    `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 16px);
  `}
`;

const SuggestionText = styled.div`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.green700};
  font-weight: ${tokens.fontWeightMedium};
  line-height: 1.4;
  word-break: break-word;
  margin-top: ${tokens.spacingXs};
`;

const ExplanationPreview = styled.div`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
  line-height: 1.4;
  margin-top: ${tokens.spacingXs};
  word-break: break-word;
`;

const DismissButton = styled(IconButton)`
  flex-shrink: 0;
`;

const ExpandedContent = styled.div`
  padding: 0 ${tokens.spacingM} ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${tokens.spacingS};
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
  background: ${(props) => (props.isActive ? tokens.blue100 : "transparent")};
  color: ${(props) => (props.isActive ? tokens.blue600 : tokens.gray500)};
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${tokens.gray100};
    color: ${tokens.gray700};
  }
`;

// Success animation for feedback submission
const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const FeedbackPanel = styled.div`
  margin-top: ${tokens.spacingS};
  padding-top: ${tokens.spacingS};
  border-top: 1px solid ${tokens.gray200};
`;

const FeedbackTextareaWrapper = styled.div`
  margin-bottom: ${tokens.spacingS};
`;

const FeedbackSubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingS};
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

const CompactButton = styled(Button)`
  padding: ${tokens.spacing2Xs} ${tokens.spacingXs};
  min-height: ${tokens.spacingL};
  height: ${tokens.spacingL};
  font-size: ${tokens.fontSizeS};
  line-height: ${tokens.lineHeightCondensed};
`;

/**
 * Format the category name for display
 */
const formatCategory = (category: string | null | undefined): string => {
  if (!category) return "Issue";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

/**
 * Format the subcategory for display (convert snake_case to readable text)
 */
const formatSubcategory = (subcategory: string | number | null | undefined): string | null => {
  if (subcategory === null || subcategory === undefined) return null;
  if (typeof subcategory === "number") return String(subcategory);
  // Convert snake_case to readable text
  return subcategory
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Get the explanation from the API or generate a fallback
 */
const getExplanation = (suggestion: Suggestion): string => {
  // Use the explanation from the API if available
  if (suggestion.explanation) {
    return suggestion.explanation;
  }
  // Fallback to subcategory-based explanation
  const subcategory = suggestion.subcategory;
  if (typeof subcategory === "string") {
    // Convert snake_case to readable text
    return subcategory
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  return "Review this suggestion for potential improvements.";
};

export const SuggestionCard = forwardRef<HTMLDivElement, SuggestionCardProps>(
  (
    {
      suggestion,
      isExpanded,
      isExiting = false,
      onToggle,
      onApply,
      onDismiss,
      onSubmitFeedback,
      isFeedbackLoading = false,
    },
    ref,
  ) => {
    // Feedback state
    const [feedbackType, setFeedbackType] = useState<boolean | null>(null);
    const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Memoize the display text to strip HTML tags for rich text content
    const displayIssue = useMemo(
      () => stripHtmlForDisplay(suggestion.original) || "",
      [suggestion.original],
    );

    const displaySuggestion = useMemo(
      () => stripHtmlForDisplay(suggestion.suggestion) || "(delete)",
      [suggestion.suggestion],
    );

    const displayExplanation = useMemo(
      () => stripHtmlForDisplay(getExplanation(suggestion)),
      [suggestion],
    );

    const handleThumbClick = useCallback(
      (helpful: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        // If clicking the same active thumb, collapse the panel
        if (feedbackType === helpful && showFeedbackPanel) {
          setShowFeedbackPanel(false);
          setFeedbackType(null);
          setFeedbackText("");
          setFeedbackSubmitted(false);
        } else {
          // Expand with the selected type
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
          await onSubmitFeedback({
            helpful: feedbackType,
            feedbackText,
            original: suggestion.original,
            suggestion: suggestion.suggestion,
            category: suggestion.category,
          });
          setFeedbackSubmitted(true);
          // Keep the panel open but clear the text for potential new feedback
          setFeedbackText("");
        } catch (error) {
          console.error("Failed to submit feedback:", error);
        }
      },
      [feedbackType, feedbackText, onSubmitFeedback, suggestion],
    );

    const handleApply = (e: React.MouseEvent) => {
      e.stopPropagation();
      onApply();
    };

    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss();
    };

    return (
      <CardContainer ref={ref} isExpanded={isExpanded} isExiting={isExiting} onClick={onToggle}>
        <CardHeader>
          <CardHeaderLeft>
            <CategoryRow>
              <CategoryLabel>
                {formatCategory(suggestion.category)}
                {formatSubcategory(suggestion.subcategory) && (
                  <SubcategoryLabel>
                    {" "}
                    <CategoryArrow>
                      <CaretRightIcon />
                    </CategoryArrow>{" "}
                    {formatSubcategory(suggestion.subcategory)}
                  </SubcategoryLabel>
                )}
              </CategoryLabel>
              <SeverityBadge severity={suggestion.severity}>{suggestion.severity}</SeverityBadge>
            </CategoryRow>
            <IssueText isTruncated={!isExpanded}>
              <FieldLabel>Issue:</FieldLabel>
              {displayIssue}
            </IssueText>
            {isExpanded && (
              <>
                <SuggestionText>
                  <FieldLabel>Suggestion:</FieldLabel>
                  {displaySuggestion}
                </SuggestionText>
                <ExplanationPreview>
                  <FieldLabel>Explanation:</FieldLabel>
                  {displayExplanation}
                </ExplanationPreview>
              </>
            )}
          </CardHeaderLeft>
          <DismissButton
            aria-label="Dismiss suggestion"
            icon={<XIcon size="tiny" />}
            variant="transparent"
            size="small"
            onClick={handleDismiss}
          />
        </CardHeader>

        {isExpanded && (
          <ExpandedContent>
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
              <CompactButton variant="positive" onClick={handleApply}>
                Apply
              </CompactButton>
            </ActionRow>

            {showFeedbackPanel && (
              <FeedbackPanel
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FeedbackTextareaWrapper>
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => {
                      setFeedbackText(e.target.value);
                    }}
                    placeholder="Share your feedback about this suggestion (optional)..."
                    aria-label="Feedback (optional)"
                    rows={3}
                    isDisabled={isFeedbackLoading}
                  />
                </FeedbackTextareaWrapper>
                <FeedbackSubmitRow>
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
                </FeedbackSubmitRow>
              </FeedbackPanel>
            )}
          </ExpandedContent>
        )}
      </CardContainer>
    );
  },
);

SuggestionCard.displayName = "SuggestionCard";
