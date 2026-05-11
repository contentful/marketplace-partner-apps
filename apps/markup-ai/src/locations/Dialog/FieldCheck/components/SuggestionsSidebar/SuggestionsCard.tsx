/**
 * Suggestion list rendered inside an expanded SuggestionCard.
 * Inline layout that mirrors the "Issue: <text>" pattern: a "Suggestion(s):"
 * label followed by one or more clickable suggestion strings — clicking
 * applies. No Apply button, no green card; multi-suggestion items stack
 * below the first with matching left indentation. Show more / Show less
 * overflow toggle for >3 items.
 */

import React, { useMemo, useState } from "react";
import { CaretDownIcon, CaretUpIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

const VISIBLE_LIMIT = 3;

export interface SuggestionsCardItem {
  text: string;
  onApply: (event: React.MouseEvent) => void;
}

export interface SuggestionsCardApplyAllControl {
  peerCount: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface SuggestionsCardProps {
  items: SuggestionsCardItem[];
  canInteract: boolean;
}

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${tokens.spacingXs};
  font-size: ${tokens.fontSizeS};
  line-height: 1.4;
`;

const Label = styled.span`
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  flex-shrink: 0;
  white-space: nowrap;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
  min-width: 0;
`;

const SuggestionItem = styled.button<{ canInteract: boolean }>`
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  text-align: left;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  line-height: 1.4;
  color: ${tokens.green700};
  cursor: ${(p) => (p.canInteract ? "pointer" : "not-allowed")};
  opacity: ${(p) => (p.canInteract ? 1 : 0.6)};
  word-break: break-word;
  white-space: normal;
  transition: color 0.15s ease;

  &:hover {
    color: ${(p) => (p.canInteract ? tokens.green800 : tokens.green700)};
    text-decoration: ${(p) => (p.canInteract ? "underline" : "none")};
  }
`;

const OverflowToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  padding: 0;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray600};
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    color: ${tokens.gray800};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const SuggestionsCard: React.FC<SuggestionsCardProps> = ({ items, canInteract }) => {
  const [showAll, setShowAll] = useState(false);

  const visibleItems = useMemo(() => {
    if (items.length <= VISIBLE_LIMIT || showAll) return items;
    return items.slice(0, VISIBLE_LIMIT);
  }, [items, showAll]);

  const hiddenCount = !showAll && items.length > VISIBLE_LIMIT ? items.length - VISIBLE_LIMIT : 0;
  const isMultiple = items.length > 1;

  return (
    <Row
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
    >
      <Label>{isMultiple ? "Suggestions:" : "Suggestion:"}</Label>
      <List>
        {visibleItems.map((item, index) => (
          <SuggestionItem
            key={`${String(index)}-${item.text}`}
            type="button"
            canInteract={canInteract}
            disabled={!canInteract}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              item.onApply(e);
            }}
            title="Click to apply this fix"
          >
            {item.text || "—"}
          </SuggestionItem>
        ))}
        {items.length > VISIBLE_LIMIT && (
          <OverflowToggle
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowAll((prev) => !prev);
            }}
            aria-expanded={showAll}
            aria-label={showAll ? "Show fewer suggestions" : `Show ${String(hiddenCount)} more`}
          >
            {showAll ? <CaretUpIcon /> : <CaretDownIcon />}
            <span>{showAll ? "Show less" : `Show more (+${String(hiddenCount)})`}</span>
          </OverflowToggle>
        )}
      </List>
    </Row>
  );
};

export interface ApplyAllOccurrencesProps {
  control: SuggestionsCardApplyAllControl;
  canInteract: boolean;
}

const ApplyAllRow = styled.label<{ canInteract: boolean }>`
  margin-top: ${tokens.spacingXs};
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  cursor: ${(p) => (p.canInteract ? "pointer" : "not-allowed")};
  opacity: ${(p) => (p.canInteract ? 1 : 0.6)};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};

  input {
    cursor: inherit;
  }
`;

export const SuggestionsCardApplyAllCheckbox: React.FC<ApplyAllOccurrencesProps> = ({
  control,
  canInteract,
}) => {
  if (control.peerCount <= 1) return null;
  return (
    <ApplyAllRow
      canInteract={canInteract}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        checked={control.checked}
        disabled={!canInteract}
        onChange={(e) => {
          control.onCheckedChange(e.target.checked);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      <span>Apply to all {String(control.peerCount)} occurrences</span>
    </ApplyAllRow>
  );
};
