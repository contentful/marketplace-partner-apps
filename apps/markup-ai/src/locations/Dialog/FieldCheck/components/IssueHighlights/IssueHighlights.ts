/**
 * TipTap extension for issue highlighting and interaction
 * Simplified - no popup cards, bidirectional sync with sidebar
 */

import { Severity } from "../../../../../api-client/types.gen";
import type { Suggestion } from "../../../../../api-client/types.gen";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import tokens from "@contentful/f36-tokens";
import { SEVERITY_COLORS } from "../../../../../utils/scoreColors";
import { buildState } from "./decorations";
import type { AppliedRange, PluginState, SuggestItem } from "./types";
import { SUGGESTIONS_SIDEBAR_SELECTOR } from "../../utils/constants";

export type IssueHighlightsOptions = {
  suggestions: Suggestion[];
  /** Original HTML string for position mapping when rendering HTML content */
  originalHtml?: string;
  /** Called when an issue is clicked in the editor - passes the suggestion and its index */
  onIssueClick?: (payload: { suggestion: Suggestion; index: number }) => void;
};

const pluginKey = new PluginKey("issue-highlights");
const SEVERITY_RENDER_ORDER: Severity[] = [Severity.HIGH, Severity.MEDIUM, Severity.LOW];
const UNDERLINE_THICKNESS_PX = 2;
const UNDERLINE_LANE_GAP_PX = 1;
const UNDERLINE_TEXT_GAP_PX = 2;
const SEVERITY_UNDERLINE_GAPS: Record<Severity, number> = {
  // Gap from text baseline to each severity lane.
  [Severity.HIGH]: UNDERLINE_TEXT_GAP_PX,
  [Severity.MEDIUM]: UNDERLINE_TEXT_GAP_PX + UNDERLINE_LANE_GAP_PX,
  [Severity.LOW]: UNDERLINE_TEXT_GAP_PX + UNDERLINE_LANE_GAP_PX * 2,
};
const UNDERLINE_PADDING_BOTTOM_PX =
  SEVERITY_UNDERLINE_GAPS[Severity.LOW] + UNDERLINE_THICKNESS_PX + 1;

const severityPriority: Record<Severity, number> = {
  [Severity.HIGH]: 3,
  [Severity.MEDIUM]: 2,
  [Severity.LOW]: 1,
};

function getSeverityForItem(item: SuggestItem, suggestions: Suggestion[]): Severity {
  const suggestion = suggestions[item.originalIndex];
  return suggestion.severity;
}

function rangesOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return !(aTo <= bFrom || aFrom >= bTo);
}

function getVisibleItems(stateLike: PluginState): SuggestItem[] {
  const visibleSet = stateLike.visibleIndices;
  return Object.values(stateLike.items).filter(
    (it) => !visibleSet || visibleSet.has(it.originalIndex),
  );
}

function appendActiveDecorations(
  rebuilt: Decoration[],
  visibleItems: SuggestItem[],
  activeId?: string | null,
): void {
  if (!activeId) return;
  for (const it of visibleItems) {
    if (it.id === activeId) {
      rebuilt.push(
        Decoration.inline(it.from, it.to, {
          class: "wp-issue-active-bg",
          style: "background-color: rgba(239,68,68,0.15); border-radius: 2px;",
        }),
      );
    }
  }
}

function buildSweepIndex(visibleItems: SuggestItem[]): {
  boundaries: number[];
  startsAt: Map<number, SuggestItem[]>;
  endsAt: Map<number, SuggestItem[]>;
} {
  const boundaries = Array.from(new Set(visibleItems.flatMap((item) => [item.from, item.to]))).sort(
    (a, b) => a - b,
  );
  const startsAt = new Map<number, SuggestItem[]>();
  const endsAt = new Map<number, SuggestItem[]>();

  for (const item of visibleItems) {
    const startList = startsAt.get(item.from);
    if (startList) {
      startList.push(item);
    } else {
      startsAt.set(item.from, [item]);
    }

    const endList = endsAt.get(item.to);
    if (endList) {
      endList.push(item);
    } else {
      endsAt.set(item.to, [item]);
    }
  }

  return { boundaries, startsAt, endsAt };
}

function getRenderedSeverities(segmentItems: SuggestItem[], suggestions: Suggestion[]): Severity[] {
  const severitiesPresent = new Set<Severity>();
  for (const item of segmentItems) {
    severitiesPresent.add(getSeverityForItem(item, suggestions));
  }
  return SEVERITY_RENDER_ORDER.filter((severity) => severitiesPresent.has(severity));
}

function buildUnderlineStyle(renderedSeverities: Severity[]): string {
  const backgroundImage = renderedSeverities
    .map((severity) => {
      const underlineColor = SEVERITY_COLORS[severity].text;
      return `linear-gradient(${underlineColor}, ${underlineColor})`;
    })
    .join(", ");
  const backgroundSize = renderedSeverities
    .map(() => `100% ${String(UNDERLINE_THICKNESS_PX)}px`)
    .join(", ");
  const backgroundPosition = renderedSeverities
    .map((severity) => {
      const gapBelowText = SEVERITY_UNDERLINE_GAPS[severity];
      const offsetFromBottom = UNDERLINE_PADDING_BOTTOM_PX - gapBelowText;
      return `0 calc(100% - ${String(offsetFromBottom)}px)`;
    })
    .join(", ");

  return `text-decoration: none; padding-bottom: ${String(UNDERLINE_PADDING_BOTTOM_PX)}px; background-image: ${backgroundImage}; background-repeat: no-repeat; background-size: ${backgroundSize}; background-position: ${backgroundPosition}; box-decoration-break: clone; -webkit-box-decoration-break: clone; cursor: pointer;`;
}

function pickAnchorItem(segmentItems: SuggestItem[], suggestions: Suggestion[]): SuggestItem {
  return [...segmentItems].sort((a, b) => {
    const aSeverity = getSeverityForItem(a, suggestions);
    const bSeverity = getSeverityForItem(b, suggestions);
    const bySeverity = severityPriority[bSeverity] - severityPriority[aSeverity];
    if (bySeverity !== 0) return bySeverity;
    return a.to - a.from - (b.to - b.from);
  })[0];
}

function appendSegmentDecorations(
  rebuilt: Decoration[],
  visibleItems: SuggestItem[],
  suggestions: Suggestion[],
): void {
  const { boundaries, startsAt, endsAt } = buildSweepIndex(visibleItems);
  const activeById = new Map<string, SuggestItem>();

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segFrom = boundaries[i];
    const segTo = boundaries[i + 1];
    if (segFrom >= segTo) continue;

    const endingItems = endsAt.get(segFrom);
    if (endingItems) {
      for (const item of endingItems) {
        activeById.delete(item.id);
      }
    }
    const startingItems = startsAt.get(segFrom);
    if (startingItems) {
      for (const item of startingItems) {
        activeById.set(item.id, item);
      }
    }

    const segmentItems = Array.from(activeById.values());
    if (segmentItems.length === 0) continue;

    const renderedSeverities = getRenderedSeverities(segmentItems, suggestions);
    const style = buildUnderlineStyle(renderedSeverities);
    const anchor = pickAnchorItem(segmentItems, suggestions);

    rebuilt.push(
      Decoration.inline(segFrom, segTo, {
        class: "wp-issue-underline",
        "data-category": anchor.category ?? "",
        "data-subcategory": String(anchor.subcategory ?? ""),
        "data-suggest-id": anchor.id,
        "data-suggest-ids": segmentItems.map((item) => item.id).join(","),
        "data-suggestion": anchor.suggestion,
        style,
      }),
    );
  }
}

function appendAppliedRangeDecorations(
  rebuilt: Decoration[],
  appliedRanges?: AppliedRange[],
): void {
  for (const range of appliedRanges ?? []) {
    if (range.from < range.to) {
      rebuilt.push(
        Decoration.inline(range.from, range.to, {
          class: "wp-applied-fix",
          style: `background-color: ${tokens.green100}; border-radius: 2px;`,
        }),
      );
    }
  }
}

function toPluginState(
  doc: Parameters<typeof DecorationSet.create>[0],
  stateLike: PluginState,
  rebuilt: Decoration[],
): PluginState {
  return {
    decos: DecorationSet.create(doc, rebuilt),
    items: stateLike.items,
    suggestions: stateLike.suggestions,
    appliedRanges: stateLike.appliedRanges,
    visibleIndices: stateLike.visibleIndices,
    activeId: stateLike.activeId,
    navRequest: stateLike.navRequest,
    gotoIndex: stateLike.gotoIndex,
  } as PluginState;
}

export const IssueHighlights = Extension.create<IssueHighlightsOptions>({
  name: "issueHighlights",
  addOptions() {
    return {
      suggestions: [],
    };
  },
  addProseMirrorPlugins() {
    const opts = this.options;
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () =>
            ({
              decos: DecorationSet.empty,
              items: {},
              suggestions: [],
              appliedRanges: [],
            }) as PluginState,
          apply: (tr, oldState: PluginState) => {
            const meta = tr.getMeta(pluginKey) as
              | {
                  suggestions?: Suggestion[];
                  clear?: boolean;
                  removeId?: string;
                  removeIds?: string[];
                  removeRange?: { from: number; to: number };
                  activeId?: string | null;
                  navRequest?: "first" | "next" | "prev" | "goto" | null;
                  gotoIndex?: number;
                  visibleIndices?: number[];
                  appliedRange?: AppliedRange;
                }
              | undefined;
            if (meta?.clear) {
              return {
                decos: DecorationSet.empty,
                items: {},
                suggestions: [],
                appliedRanges: [],
                activeId: null,
                navRequest: undefined,
              } as PluginState;
            }
            if (meta?.suggestions) {
              // Pass originalHtml from meta or from options for HTML position mapping
              const originalHtml =
                (meta as { originalHtml?: string }).originalHtml ?? opts.originalHtml;
              const base = buildState(tr.doc, meta.suggestions, originalHtml);
              return {
                ...base,
                appliedRanges: [],
                activeId: null,
                navRequest: undefined,
              } as PluginState;
            }
            let next = oldState;
            if (tr.docChanged) {
              const mapped = oldState.decos.map(tr.mapping, tr.doc);
              const newItems: Record<string, SuggestItem> = {};
              for (const [id, item] of Object.entries(oldState.items)) {
                // Use assoc=-1 for 'from' to stick to left of insertion
                // Use assoc=1 for 'to' to stick to right of insertion
                const newFrom = tr.mapping.map(item.from, -1);
                const newTo = tr.mapping.map(item.to, 1);
                // Skip items that have collapsed (from >= to)
                if (newFrom >= newTo) continue;
                newItems[id] = {
                  ...item,
                  from: newFrom,
                  to: newTo,
                };
              }
              // Map applied ranges through document changes
              const mappedAppliedRanges: AppliedRange[] = (oldState.appliedRanges ?? [])
                .map((range) => ({
                  from: tr.mapping.map(range.from, -1),
                  to: tr.mapping.map(range.to, 1),
                }))
                .filter((range) => range.from < range.to);

              next = {
                decos: mapped,
                items: newItems,
                suggestions: oldState.suggestions,
                appliedRanges: mappedAppliedRanges,
                visibleIndices: oldState.visibleIndices,
                activeId: oldState.activeId,
                navRequest: oldState.navRequest,
                gotoIndex: oldState.gotoIndex,
              } as PluginState;
            }
            // Helper to rebuild all decorations from items, with active highlight
            // Only creates decorations for items whose originalIndex is in visibleIndices (if set)
            const rebuildFrom = (stateLike: PluginState) => {
              const rebuilt: Decoration[] = [];
              const visibleItems = getVisibleItems(stateLike);
              appendActiveDecorations(rebuilt, visibleItems, stateLike.activeId);
              appendSegmentDecorations(rebuilt, visibleItems, stateLike.suggestions);
              appendAppliedRangeDecorations(rebuilt, stateLike.appliedRanges);
              return toPluginState(tr.doc, stateLike, rebuilt);
            };
            // Handle appliedRange from applySuggestionByIndex
            if (meta && Object.hasOwn(meta, "appliedRange")) {
              const newRange = (meta as { appliedRange?: AppliedRange }).appliedRange;
              if (newRange && newRange.from < newRange.to) {
                next = {
                  ...next,
                  appliedRanges: [...(next.appliedRanges ?? []), newRange],
                };
              }
            }
            if (meta?.removeIds && meta.removeIds.length > 0) {
              const restEntries = Object.entries(next.items).filter(
                ([id]) => !(meta.removeIds ?? []).includes(id),
              );
              const reduced: PluginState = {
                ...next,
                items: Object.fromEntries(restEntries),
              };
              next = rebuildFrom(reduced);
            }
            if (meta?.removeRange) {
              const from = tr.mapping.map(meta.removeRange.from);
              const to = tr.mapping.map(meta.removeRange.to);
              const overlaps = (aFrom: number, aTo: number) => !(aTo <= from || aFrom >= to);
              const restEntries = Object.entries(next.items).filter(
                ([, it]) => !overlaps(it.from, it.to),
              );
              const reduced: PluginState = {
                ...next,
                items: Object.fromEntries(restEntries),
              };
              next = rebuildFrom(reduced);
            }
            if (meta?.removeId) {
              const id = meta.removeId;
              if (Object.hasOwn(next.items, id)) {
                const rest = Object.fromEntries(
                  Object.entries(next.items).filter(([key]) => key !== id),
                );
                const reduced: PluginState = {
                  ...next,
                  items: rest,
                };
                next = rebuildFrom(reduced);
              }
            }
            if (meta && Object.hasOwn(meta, "activeId")) {
              const updated: PluginState = {
                ...next,
                activeId: meta.activeId ?? null,
              };
              next = rebuildFrom(updated);
            }
            if (meta && Object.hasOwn(meta, "navRequest")) {
              const updated: PluginState = {
                ...next,
                navRequest: meta.navRequest ?? undefined,
                gotoIndex: meta.gotoIndex,
              };
              next = rebuildFrom(updated);
            }
            // Handle visibility filter change
            if (meta && Object.hasOwn(meta, "visibleIndices")) {
              const newVisibleSet = new Set(meta.visibleIndices ?? []);
              const updated: PluginState = {
                ...next,
                visibleIndices: newVisibleSet,
              };
              next = rebuildFrom(updated);
            }
            return next;
          },
        },
        props: {
          decorations: (__state) => (pluginKey.getState(__state) as PluginState).decos,
        },
        view(view) {
          let activeAnchorId: string | null = null;

          function findAnchorById(anchorId: string): HTMLElement | null {
            // Search within the editor's DOM for better scoping
            const nodes = view.dom.querySelectorAll(".wp-issue-underline");
            for (const node of Array.from(nodes)) {
              const el = node as HTMLElement;
              if (el.dataset.suggestId === anchorId) {
                return el;
              }
            }
            // Fallback to document search if not found in editor
            const allNodes = document.querySelectorAll(".wp-issue-underline");
            for (const node of Array.from(allNodes)) {
              const el = node as HTMLElement;
              if (el.dataset.suggestId === anchorId) {
                return el;
              }
            }
            return null;
          }

          // Click handler - notify parent component, set active highlight
          // For overlapping suggestions, prioritize by click proximity first, then severity.
          const handleClick = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            if (!target) return;
            const el = target.closest(".wp-issue-underline");
            if (!el) return;
            ev.preventDefault();
            ev.stopPropagation();
            const state = pluginKey.getState(view.state) as PluginState;
            const clickPos = view.posAtCoords({ left: ev.clientX, top: ev.clientY })?.pos;
            const visibleSet = state.visibleIndices;

            const suggestIdsCsv = (el as HTMLElement).dataset.suggestIds ?? "";
            const segmentIds = suggestIdsCsv
              .split(",")
              .map((x) => x.trim())
              .filter((x) => x.length > 0);

            // Prefer item IDs attached to this rendered segment. Fallback to single id + overlap.
            let candidateItems: SuggestItem[] = [];
            if (segmentIds.length > 0) {
              candidateItems = segmentIds.map((segmentId) => state.items[segmentId]);
            } else {
              const id = (el as HTMLElement).dataset.suggestId ?? "";
              if (!id) return;
              const clickedItem = state.items[id] as SuggestItem | undefined;
              if (!clickedItem) return;
              candidateItems = Object.values(state.items).filter((it) => {
                if (visibleSet && !visibleSet.has(it.originalIndex)) return false;
                return rangesOverlap(it.from, it.to, clickedItem.from, clickedItem.to);
              });
            }

            const overlappingCandidates = candidateItems
              .filter((it) => !visibleSet || visibleSet.has(it.originalIndex))
              .map((it) => ({
                item: it,
                suggestion: state.suggestions[it.originalIndex] as Suggestion | undefined,
              }))
              .filter((x): x is { item: SuggestItem; suggestion: Suggestion } => !!x.suggestion);

            // If available, narrow to candidates that contain the click position.
            const proximityCandidates =
              clickPos === undefined
                ? overlappingCandidates
                : overlappingCandidates.filter(
                    ({ item }) => clickPos >= item.from && clickPos <= item.to,
                  );
            const candidates =
              proximityCandidates.length > 0 ? proximityCandidates : overlappingCandidates;

            // Sort by proximity first, then severity
            candidates.sort((a, b) => {
              const aDistance =
                clickPos === undefined ? 0 : Math.abs(clickPos - (a.item.from + a.item.to) / 2);
              const bDistance =
                clickPos === undefined ? 0 : Math.abs(clickPos - (b.item.from + b.item.to) / 2);
              if (aDistance !== bDistance) {
                return aDistance - bDistance;
              }

              const aPriority = severityPriority[a.suggestion.severity] || 0;
              const bPriority = severityPriority[b.suggestion.severity] || 0;
              if (aPriority !== bPriority) {
                return bPriority - aPriority;
              }

              // Final tie-breaker for deterministic behavior: shorter range wins
              const aLen = a.item.to - a.item.from;
              const bLen = b.item.to - b.item.from;
              return aLen - bLen;
            });

            const bestMatch = candidates[0] as
              | { item: SuggestItem; suggestion: Suggestion }
              | undefined;
            if (!bestMatch) return;

            const { item, suggestion } = bestMatch;

            opts.onIssueClick?.({
              suggestion,
              index: item.originalIndex,
            });

            // Set active highlight for selected item
            const tr = view.state.tr;
            tr.setMeta(pluginKey, { activeId: item.id });
            view.dispatch(tr);
            activeAnchorId = item.id;
          };

          // Clear active highlight on outside click
          const handleOutsideClick = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            if (!target) return;
            if (target.closest(".wp-issue-underline")) {
              return;
            }
            // Keep current highlight when interacting with the suggestions sidebar
            // (e.g. thumbs up/down feedback). Highlight should remain while card is expanded.
            if (target.closest(SUGGESTIONS_SIDEBAR_SELECTOR)) {
              return;
            }
            if (activeAnchorId) {
              const tr = view.state.tr;
              tr.setMeta(pluginKey, { activeId: null });
              view.dispatch(tr);
              activeAnchorId = null;
            }
          };

          const waitForScrollEnd = (
            target: HTMLElement | typeof globalThis,
            idleMs = 180,
            maxWaitMs = 1500,
          ): Promise<void> => {
            return new Promise((resolve) => {
              let idleTimer: ReturnType<typeof setTimeout> | undefined;
              const done = () => {
                if (idleTimer) clearTimeout(idleTimer);
                clearTimeout(maxTimer);
                target.removeEventListener("scroll", onScroll, true);
                resolve();
              };
              const onScroll = () => {
                if (idleTimer) clearTimeout(idleTimer);
                idleTimer = setTimeout(done, idleMs);
              };
              target.addEventListener("scroll", onScroll, true);
              // Arm timers immediately in case no scroll occurs
              onScroll();
              const maxTimer = setTimeout(done, maxWaitMs);
            });
          };

          function scrollAnchorIntoView(anchorId: string): Promise<void> {
            const anchor = findAnchorById(anchorId);
            if (!anchor) {
              console.warn("[IssueHighlights] Anchor not found for ID:", anchorId);
              return Promise.resolve();
            }

            // Use native scrollIntoView which handles finding the correct scroll container
            anchor.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });

            return waitForScrollEnd(window);
          }

          document.addEventListener("mousedown", handleOutsideClick, true);
          view.dom.addEventListener("click", handleClick, true);

          return {
            update: (viewInstance) => {
              const st = pluginKey.getState(viewInstance.state) as PluginState;
              if (!st.navRequest) return;

              // Capture the navRequest and gotoIndex before clearing it
              const navRequest = st.navRequest;
              const gotoIndex = st.gotoIndex;

              // Clear navRequest IMMEDIATELY to prevent re-entrancy
              const clearTr = viewInstance.state.tr;
              clearTr.setMeta(pluginKey, { navRequest: null, gotoIndex: undefined });
              viewInstance.dispatch(clearTr);

              // For "goto" navigation from sidebar, find the item by index and scroll to it
              if (navRequest === "goto" && gotoIndex !== undefined) {
                // Find the item with this originalIndex
                const targetItem = Object.values(st.items).find(
                  (item) => item.originalIndex === gotoIndex,
                );
                if (targetItem) {
                  // activeId was already set by the goToIssueGroup command, just update local tracker
                  activeAnchorId = targetItem.id;

                  // Wait for DOM to update with decorations before scrolling
                  // Use requestAnimationFrame + setTimeout to ensure decorations are rendered
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      void scrollAnchorIntoView(targetItem.id);
                    }, 50);
                  });
                }
              }
            },
            destroy: () => {
              document.removeEventListener("mousedown", handleOutsideClick, true);
              view.dom.removeEventListener("click", handleClick, true);
            },
          };
        },
      }),
    ];
  },
  addCommands() {
    return {
      setSuggestionHighlights:
        (suggestions: Suggestion[], originalHtml?: string) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { suggestions, originalHtml }));
          return true;
        },
      clearSuggestionHighlights:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { clear: true }));
          return true;
        },
      firstIssueGroup:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { navRequest: "first" }));
          return true;
        },
      nextIssueGroup:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { navRequest: "next" }));
          return true;
        },
      prevIssueGroup:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { navRequest: "prev" }));
          return true;
        },
      goToIssueGroup:
        (index: number) =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;
          const st = pluginKey.getState(state) as PluginState;
          // Find the item with this originalIndex
          const targetItem = Object.values(st.items).find((item) => item.originalIndex === index);
          if (targetItem) {
            // Set activeId for immediate highlighting AND navRequest to trigger scrolling in update
            dispatch(
              tr.setMeta(pluginKey, {
                activeId: targetItem.id,
                navRequest: "goto",
                gotoIndex: index,
              }),
            );
          }
          return true;
        },
      applySuggestionByIndex:
        (index: number) =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;
          const st = pluginKey.getState(state) as PluginState;
          // Find the item with this originalIndex
          const targetItem = Object.values(st.items).find((item) => item.originalIndex === index);
          if (!targetItem) return false;

          // Get all overlapping items to remove together
          const overlaps = (aFrom: number, aTo: number) =>
            !(aTo <= targetItem.from || aFrom >= targetItem.to);
          const overlappingIds = Object.values(st.items)
            .filter((it) => overlaps(it.from, it.to))
            .map((it) => it.id);

          let replacementText = targetItem.suggestion;

          // Check if the suggestion contains HTML tags - if so, extract just the text content
          // This is for rich text mode where the API returns HTML but we insert as text
          const containsHtml = /<[^>]+>/.test(replacementText);
          if (containsHtml) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = replacementText;
            replacementText = tempDiv.textContent || tempDiv.innerText || "";
          }

          // Use a single insertText call which properly maintains position mappings
          // This replaces the range [from, to) with the new text atomically
          const newTr = tr.insertText(replacementText, targetItem.from, targetItem.to);

          // Calculate the range of the newly inserted text for green highlighting
          const appliedRange: AppliedRange = {
            from: targetItem.from,
            to: targetItem.from + replacementText.length,
          };

          // Remove all overlapping highlights and record the applied range
          newTr.setMeta(pluginKey, { removeIds: overlappingIds, activeId: null, appliedRange });
          dispatch(newTr);
          return true;
        },
      setVisibleSuggestions:
        (indices: number[]) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { visibleIndices: indices }));
          return true;
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    issueHighlights: {
      setSuggestionHighlights: (suggestions: Suggestion[], originalHtml?: string) => ReturnType;
      clearSuggestionHighlights: () => ReturnType;
      firstIssueGroup: () => ReturnType;
      nextIssueGroup: () => ReturnType;
      prevIssueGroup: () => ReturnType;
      goToIssueGroup: (index: number) => ReturnType;
      applySuggestionByIndex: (index: number) => ReturnType;
      /** Set which suggestion indices should be visible (for filtering) */
      setVisibleSuggestions: (indices: number[]) => ReturnType;
    };
  }
}

// Minimal styles for the underline are applied inline via style attribute in decorations.
// If we need more control across themes, we can also export a class name here.
