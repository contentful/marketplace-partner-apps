/**
 * Issue card view utilities for positioning and rendering
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { IssueCard } from "./IssueCard";
import type { SuggestItem } from "./types";

export interface IssueCardHandles {
  el: HTMLElement;
  showAt: (
    left: number,
    top: number,
    item: SuggestItem,
    currentIndex: number,
    totalCount: number,
    callbacks: {
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
      onClose?: () => void;
    },
  ) => void;
  hide: () => void;
  destroy: () => void;
}

/**
 * Creates a portal-based issue card element
 */
export function createIssueCardRoot(): IssueCardHandles {
  const el = document.createElement("div");
  el.className = "wp-issue-card-portal";
  el.style.position = "fixed";
  el.style.zIndex = "1000";
  el.style.display = "none";
  document.body.appendChild(el);

  const root = createRoot(el);

  const handles: IssueCardHandles = {
    el,
    showAt: (left, top, item, currentIndex, totalCount, callbacks) => {
      el.style.left = `${String(left)}px`;
      el.style.top = `${String(top)}px`;
      el.style.display = "block";

      root.render(
        <IssueCard
          item={item}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onPrevious={callbacks.onPrevious}
          onNext={callbacks.onNext}
          onApplySuggestion={callbacks.onApplySuggestion}
          onSubmitFeedback={callbacks.onSubmitFeedback}
          updatePosition={callbacks.updatePosition}
        />,
      );
    },
    hide: () => {
      el.style.display = "none";
    },
    destroy: () => {
      root.unmount();
      el.remove();
    },
  };

  return handles;
}

/**
 * Positions the issue card near the anchor element
 */
export function positionIssueCardToAnchor(
  cardEl: HTMLElement,
  anchorId: string,
  offsetX = 8,
  offsetY = 8,
  fallbackIds: string[] = [],
): void {
  // Find the anchor element
  let anchor: HTMLElement | null = null;
  const allIds = [anchorId, ...fallbackIds];

  for (const id of allIds) {
    const elements = document.querySelectorAll(".wp-issue-underline");
    for (const el of Array.from(elements)) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.dataset.suggestId === id) {
        anchor = htmlEl;
        break;
      }
    }
    if (anchor) break;
  }

  if (!anchor) {
    console.warn(`Could not find anchor with ID: ${anchorId}`);
    return;
  }

  const anchorRect = anchor.getBoundingClientRect();
  const cardWidth = 288; // Fixed width from styles (w-72 = 18rem = 288px)
  const cardHeight = cardEl.offsetHeight || 200;

  // Calculate initial position (below and to the right of anchor)
  let left = anchorRect.left + offsetX;
  let top = anchorRect.bottom + offsetY;

  // Adjust if card would go off-screen to the right
  if (left + cardWidth > window.innerWidth) {
    left = window.innerWidth - cardWidth - 16;
  }

  // Adjust if card would go off-screen at the bottom
  if (top + cardHeight > window.innerHeight) {
    // Try to position above the anchor instead
    top = anchorRect.top - cardHeight - offsetY;

    // If still off-screen, position at the bottom of viewport
    if (top < 0) {
      top = window.innerHeight - cardHeight - 16;
    }
  }

  // Ensure minimum margins
  left = Math.max(16, left);
  top = Math.max(16, top);

  cardEl.style.left = `${String(left)}px`;
  cardEl.style.top = `${String(top)}px`;
}
