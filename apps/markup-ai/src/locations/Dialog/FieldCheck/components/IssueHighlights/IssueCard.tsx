/**
 * Issue card component showing suggestion details
 */

import React, { useState, useLayoutEffect } from "react";
import { Button } from "@contentful/f36-components";
import { CaretLeftIcon, CaretRightIcon, ThumbsUpIcon, ThumbsDownIcon } from "@contentful/f36-icons";
import type { SuggestItem } from "./types";
import {
  CardContainer,
  CardHeader,
  CategoryTitle,
  NavigationControls,
  NavButton,
  NavCounter,
  ContextSentence,
  SuggestionBox,
  SuggestionLabel,
  SuggestionText,
  ApplyButton,
  FeedbackControls,
  FeedbackButton,
  FeedbackPanel,
  FeedbackTextarea,
  FeedbackActions,
} from "./IssueCard.styles";

export interface IssueCardProps {
  item: SuggestItem;
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onApplySuggestion: () => void;
  onSubmitFeedback: (payload: {
    helpful: boolean;
    feedback: string;
    original: string;
    suggestion: string;
    category: string | null | undefined;
    subcategory: string | number | null | undefined;
  }) => void;
  updatePosition: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  item,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onApplySuggestion,
  onSubmitFeedback,
  updatePosition,
}) => {
  const [feedback, setFeedback] = useState("");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useLayoutEffect(() => {
    updatePosition();
  }, [showFeedback, updatePosition]);

  const handleThumbClick = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    setShowFeedback(true);
  };

  const handleSubmit = () => {
    if (helpful === null) return;

    onSubmitFeedback({
      helpful,
      feedback,
      original: item.original || "",
      suggestion: item.suggestion,
      category: item.category,
      subcategory: item.subcategory,
    });

    // Reset state
    setFeedback("");
    setHelpful(null);
    setShowFeedback(false);
  };

  const categoryLabel = ((item.category as string | undefined) ?? "").trim() || "Issue";
  const contextSentence = categoryLabel
    ? `${categoryLabel}: ${String(item.subcategory ?? "")}`
    : "";

  return (
    <CardContainer className="wp-issue-card">
      <CardHeader>
        <CategoryTitle>{categoryLabel}</CategoryTitle>
        <NavigationControls>
          <NavButton
            type="button"
            onClick={onPrevious}
            disabled={totalCount <= 1}
            aria-label="Previous"
          >
            <CaretLeftIcon variant="muted" />
          </NavButton>
          <NavCounter>
            {currentIndex + 1} / {totalCount}
          </NavCounter>
          <NavButton
            type="button"
            onClick={onNext}
            disabled={totalCount <= 1 || currentIndex === totalCount - 1}
            aria-label="Next"
          >
            <CaretRightIcon variant="muted" />
          </NavButton>
        </NavigationControls>
      </CardHeader>

      <ContextSentence>{contextSentence}</ContextSentence>

      <SuggestionBox>
        <SuggestionLabel>Suggestion</SuggestionLabel>
        <SuggestionText>{item.suggestion || "Suggestion not available"}</SuggestionText>
        {item.suggestion && (
          <ApplyButton type="button" onClick={onApplySuggestion}>
            Apply
          </ApplyButton>
        )}
      </SuggestionBox>

      <FeedbackControls>
        <FeedbackButton
          type="button"
          onClick={() => {
            handleThumbClick(true);
          }}
          isActive={helpful === true}
          aria-label="Helpful"
        >
          <ThumbsUpIcon variant="muted" />
        </FeedbackButton>
        <FeedbackButton
          type="button"
          onClick={() => {
            handleThumbClick(false);
          }}
          isActive={helpful === false}
          aria-label="Not helpful"
        >
          <ThumbsDownIcon variant="muted" />
        </FeedbackButton>
      </FeedbackControls>

      {showFeedback && (
        <FeedbackPanel>
          <FeedbackTextarea
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
            }}
            placeholder="Your feedback..."
            rows={3}
          />
          <FeedbackActions>
            <Button
              size="small"
              variant="primary"
              onClick={handleSubmit}
              isDisabled={helpful === null}
            >
              Submit Feedback
            </Button>
          </FeedbackActions>
        </FeedbackPanel>
      )}
    </CardContainer>
  );
};
