/**
 * TipTap extension for Cortex issue highlighting and interaction.
 *
 * Consumes CortexIssueWithId[] directly; offsets are translated from source-text
 * (html/markdown/plain) coordinates to ProseMirror positions via the offset mapper.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import type { Mapping } from "@tiptap/pm/transform";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import tokens from "@contentful/f36-tokens";
import type { CortexIssueWithId, CortexSeverity } from "../../../../../agents/types";
import { SEVERITY_COLORS } from "../../../../../utils/scoreColors";
import { buildState } from "./decorations";
import type { AppliedRange, IssueSourceFormat, PluginState, SuggestItem } from "./types";
import { SUGGESTIONS_SIDEBAR_SELECTOR } from "../../utils/constants";

export interface IssueHighlightsOptions {
  issues: CortexIssueWithId[];
  sourceFormat: IssueSourceFormat;
  /** The raw string submitted to Cortex; required when sourceFormat !== "plain". */
  sourceText?: string;
  onIssueClick?: (payload: { issue: CortexIssueWithId; index: number }) => void;
}

const pluginKey = new PluginKey("issue-highlights");
const SEVERITY_RENDER_ORDER: CortexSeverity[] = ["high", "medium", "low"];
const UNDERLINE_THICKNESS_PX = 2;
const UNDERLINE_LANE_GAP_PX = 1;
const UNDERLINE_TEXT_GAP_PX = 2;
const SEVERITY_UNDERLINE_GAPS: Record<CortexSeverity, number> = {
  high: UNDERLINE_TEXT_GAP_PX,
  medium: UNDERLINE_TEXT_GAP_PX + UNDERLINE_LANE_GAP_PX,
  low: UNDERLINE_TEXT_GAP_PX + UNDERLINE_LANE_GAP_PX * 2,
};
const UNDERLINE_PADDING_BOTTOM_PX = SEVERITY_UNDERLINE_GAPS.low + UNDERLINE_THICKNESS_PX + 1;

const severityPriority: Record<CortexSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function rangesOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return !(aTo <= bFrom || aFrom >= bTo);
}

const waitForScrollEnd = (
  target: HTMLElement | typeof globalThis,
  idleMs = 180,
  maxWaitMs = 1500,
): Promise<void> =>
  new Promise((resolve) => {
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
    onScroll();
    const maxTimer = setTimeout(done, maxWaitMs);
  });

const findItemIdsOverlappingTargets = (
  itemsMap: Record<string, SuggestItem>,
  targets: SuggestItem[],
): string[] =>
  Object.values(itemsMap)
    .filter((it) => targets.some((t) => rangesOverlap(it.from, it.to, t.from, t.to)))
    .map((it) => it.id);

interface IssueHighlightsMeta {
  issues?: CortexIssueWithId[];
  sourceFormat?: IssueSourceFormat;
  sourceText?: string;
  clear?: boolean;
  removeId?: string;
  removeIds?: string[];
  removeRange?: { from: number; to: number };
  activeId?: string | null;
  navRequest?: "first" | "next" | "prev" | "goto" | null;
  gotoIndex?: number;
  visibleIndices?: number[];
  appliedRange?: AppliedRange;
  appliedRanges?: AppliedRange[];
}

function createClearedState(): PluginState {
  return {
    decos: DecorationSet.empty,
    items: {},
    issues: [],
    appliedRanges: [],
    activeId: null,
    navRequest: undefined,
  };
}

function remapItemsForDoc(
  items: Record<string, SuggestItem>,
  mapping: Mapping,
): Record<string, SuggestItem> {
  const result: Record<string, SuggestItem> = {};
  for (const [id, item] of Object.entries(items)) {
    const newFrom = mapping.map(item.from, -1);
    const newTo = mapping.map(item.to, 1);
    if (newFrom >= newTo) continue;
    result[id] = { ...item, from: newFrom, to: newTo };
  }
  return result;
}

function remapAppliedRanges(ranges: AppliedRange[] | undefined, mapping: Mapping): AppliedRange[] {
  return (ranges ?? [])
    .map((range) => ({
      from: mapping.map(range.from, -1),
      to: mapping.map(range.to, 1),
    }))
    .filter((range) => range.from < range.to);
}

function remapStateForDocChange(oldState: PluginState, tr: Transaction): PluginState {
  return {
    decos: oldState.decos.map(tr.mapping, tr.doc),
    items: remapItemsForDoc(oldState.items, tr.mapping),
    issues: oldState.issues,
    appliedRanges: remapAppliedRanges(oldState.appliedRanges, tr.mapping),
    visibleIndices: oldState.visibleIndices,
    activeId: oldState.activeId,
    navRequest: oldState.navRequest,
    gotoIndex: oldState.gotoIndex,
  };
}

function appendAppliedRange(state: PluginState, range: AppliedRange | undefined): PluginState {
  if (!range || range.from >= range.to) return state;
  return { ...state, appliedRanges: [...(state.appliedRanges ?? []), range] };
}

function appendAppliedRanges(state: PluginState, ranges: AppliedRange[] | undefined): PluginState {
  if (!ranges) return state;
  const valid = ranges.filter((r) => r.from < r.to);
  if (valid.length === 0) return state;
  return { ...state, appliedRanges: [...(state.appliedRanges ?? []), ...valid] };
}

function omitItemsByIds(
  items: Record<string, SuggestItem>,
  ids: readonly string[],
): Record<string, SuggestItem> {
  const idSet = new Set(ids);
  return Object.fromEntries(Object.entries(items).filter(([id]) => !idSet.has(id)));
}

function omitItemsByRange(
  items: Record<string, SuggestItem>,
  from: number,
  to: number,
): Record<string, SuggestItem> {
  return Object.fromEntries(
    Object.entries(items).filter(([, it]) => !rangesOverlap(it.from, it.to, from, to)),
  );
}

/** Look up the SuggestItem in `items` whose `originalIndex` matches the given issue index. */
function findItemByIndex(
  items: Record<string, SuggestItem>,
  originalIndex: number,
): SuggestItem | undefined {
  return Object.values(items).find((item) => item.originalIndex === originalIndex);
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
    if (startList) startList.push(item);
    else startsAt.set(item.from, [item]);

    const endList = endsAt.get(item.to);
    if (endList) endList.push(item);
    else endsAt.set(item.to, [item]);
  }

  return { boundaries, startsAt, endsAt };
}

function getRenderedSeverities(segmentItems: SuggestItem[]): CortexSeverity[] {
  const present = new Set<CortexSeverity>();
  for (const item of segmentItems) present.add(item.severity);
  return SEVERITY_RENDER_ORDER.filter((s) => present.has(s));
}

function buildUnderlineStyle(renderedSeverities: CortexSeverity[]): string {
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

function pickAnchorItem(segmentItems: SuggestItem[]): SuggestItem {
  return [...segmentItems].sort((a, b) => {
    const bySeverity = severityPriority[b.severity] - severityPriority[a.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.to - a.from - (b.to - b.from);
  })[0];
}

function appendSegmentDecorations(rebuilt: Decoration[], visibleItems: SuggestItem[]): void {
  const { boundaries, startsAt, endsAt } = buildSweepIndex(visibleItems);
  const activeById = new Map<string, SuggestItem>();

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segFrom = boundaries[i];
    const segTo = boundaries[i + 1];
    if (segFrom >= segTo) continue;

    const endingItems = endsAt.get(segFrom);
    if (endingItems) for (const item of endingItems) activeById.delete(item.id);
    const startingItems = startsAt.get(segFrom);
    if (startingItems) for (const item of startingItems) activeById.set(item.id, item);

    const segmentItems = Array.from(activeById.values());
    if (segmentItems.length === 0) continue;

    const renderedSeverities = getRenderedSeverities(segmentItems);
    const style = buildUnderlineStyle(renderedSeverities);
    const anchor = pickAnchorItem(segmentItems);

    rebuilt.push(
      Decoration.inline(segFrom, segTo, {
        class: "wp-issue-underline",
        "data-agent": anchor.agent,
        "data-category": anchor.category ?? "",
        "data-severity": anchor.severity,
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
    issues: stateLike.issues,
    appliedRanges: stateLike.appliedRanges,
    visibleIndices: stateLike.visibleIndices,
    activeId: stateLike.activeId,
    navRequest: stateLike.navRequest,
    gotoIndex: stateLike.gotoIndex,
  };
}

export const IssueHighlights = Extension.create<IssueHighlightsOptions>({
  name: "issueHighlights",
  addOptions() {
    return {
      issues: [],
      sourceFormat: "plain",
    };
  },
  addProseMirrorPlugins() {
    const opts = this.options;
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: (): PluginState => ({
            decos: DecorationSet.empty,
            items: {},
            issues: [],
            appliedRanges: [],
          }),
          apply: (tr, oldState: PluginState) => {
            const meta = tr.getMeta(pluginKey) as IssueHighlightsMeta | undefined;

            if (meta?.clear) return createClearedState();
            if (meta?.issues) {
              const sourceFormat = meta.sourceFormat ?? opts.sourceFormat;
              const sourceText = meta.sourceText ?? opts.sourceText;
              const base = buildState(tr.doc, meta.issues, sourceFormat, sourceText);
              return { ...base, appliedRanges: [], activeId: null, navRequest: undefined };
            }

            let next = tr.docChanged ? remapStateForDocChange(oldState, tr) : oldState;

            const rebuildFrom = (stateLike: PluginState) => {
              const rebuilt: Decoration[] = [];
              const visibleItems = getVisibleItems(stateLike);
              appendActiveDecorations(rebuilt, visibleItems, stateLike.activeId);
              appendSegmentDecorations(rebuilt, visibleItems);
              appendAppliedRangeDecorations(rebuilt, stateLike.appliedRanges);
              return toPluginState(tr.doc, stateLike, rebuilt);
            };

            next = appendAppliedRange(next, meta?.appliedRange);
            next = appendAppliedRanges(next, meta?.appliedRanges);

            if (meta?.removeIds?.length) {
              next = rebuildFrom({ ...next, items: omitItemsByIds(next.items, meta.removeIds) });
            }
            if (meta?.removeRange) {
              const from = tr.mapping.map(meta.removeRange.from);
              const to = tr.mapping.map(meta.removeRange.to);
              next = rebuildFrom({ ...next, items: omitItemsByRange(next.items, from, to) });
            }
            if (meta?.removeId && Object.hasOwn(next.items, meta.removeId)) {
              next = rebuildFrom({ ...next, items: omitItemsByIds(next.items, [meta.removeId]) });
            }
            if (meta && Object.hasOwn(meta, "activeId")) {
              next = rebuildFrom({ ...next, activeId: meta.activeId ?? null });
            }
            if (meta && Object.hasOwn(meta, "navRequest")) {
              next = rebuildFrom({
                ...next,
                navRequest: meta.navRequest ?? undefined,
                gotoIndex: meta.gotoIndex,
              });
            }
            if (meta && Object.hasOwn(meta, "visibleIndices")) {
              next = rebuildFrom({ ...next, visibleIndices: new Set(meta.visibleIndices ?? []) });
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
            const nodes = view.dom.querySelectorAll(".wp-issue-underline");
            for (const node of Array.from(nodes)) {
              const el = node as HTMLElement;
              if (el.dataset.suggestId === anchorId) return el;
            }
            const allNodes = document.querySelectorAll(".wp-issue-underline");
            for (const node of Array.from(allNodes)) {
              const el = node as HTMLElement;
              if (el.dataset.suggestId === anchorId) return el;
            }
            return null;
          }

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

            let candidateItems: SuggestItem[];
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
                issue: state.issues[it.originalIndex] as CortexIssueWithId | undefined,
              }))
              .filter(
                (x): x is { item: SuggestItem; issue: CortexIssueWithId } => x.issue !== undefined,
              );

            const proximityCandidates =
              clickPos === undefined
                ? overlappingCandidates
                : overlappingCandidates.filter(
                    ({ item }) => clickPos >= item.from && clickPos <= item.to,
                  );
            const candidates =
              proximityCandidates.length > 0 ? proximityCandidates : overlappingCandidates;

            candidates.sort((a, b) => {
              const aDistance =
                clickPos === undefined ? 0 : Math.abs(clickPos - (a.item.from + a.item.to) / 2);
              const bDistance =
                clickPos === undefined ? 0 : Math.abs(clickPos - (b.item.from + b.item.to) / 2);
              if (aDistance !== bDistance) return aDistance - bDistance;

              const aPriority = severityPriority[a.item.severity] || 0;
              const bPriority = severityPriority[b.item.severity] || 0;
              if (aPriority !== bPriority) return bPriority - aPriority;

              return a.item.to - a.item.from - (b.item.to - b.item.from);
            });

            if (candidates.length === 0) return;
            const { item, issue } = candidates[0];

            opts.onIssueClick?.({ issue, index: item.originalIndex });

            const tr = view.state.tr;
            tr.setMeta(pluginKey, { activeId: item.id });
            view.dispatch(tr);
            activeAnchorId = item.id;
          };

          const handleOutsideClick = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            if (!target) return;
            if (target.closest(".wp-issue-underline")) return;
            if (target.closest(SUGGESTIONS_SIDEBAR_SELECTOR)) return;
            if (activeAnchorId) {
              const tr = view.state.tr;
              tr.setMeta(pluginKey, { activeId: null });
              view.dispatch(tr);
              activeAnchorId = null;
            }
          };

          function scrollAnchorIntoView(anchorId: string): Promise<void> {
            const anchor = findAnchorById(anchorId);
            if (!anchor) return Promise.resolve();
            anchor.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            return waitForScrollEnd(globalThis);
          }

          document.addEventListener("mousedown", handleOutsideClick, true);
          view.dom.addEventListener("click", handleClick, true);

          return {
            update: (viewInstance) => {
              const st = pluginKey.getState(viewInstance.state) as PluginState;
              if (!st.navRequest) return;

              const navRequest = st.navRequest;
              const gotoIndex = st.gotoIndex;

              const clearTr = viewInstance.state.tr;
              clearTr.setMeta(pluginKey, { navRequest: null, gotoIndex: undefined });
              viewInstance.dispatch(clearTr);

              if (navRequest === "goto" && gotoIndex !== undefined) {
                const targetItem = Object.values(st.items).find(
                  (item) => item.originalIndex === gotoIndex,
                );
                if (targetItem) {
                  activeAnchorId = targetItem.id;
                  const triggerScroll = () => {
                    void scrollAnchorIntoView(targetItem.id);
                  };
                  requestAnimationFrame(() => setTimeout(triggerScroll, 50));
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
      setIssueHighlights:
        (issues: CortexIssueWithId[], sourceFormat: IssueSourceFormat, sourceText?: string) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { issues, sourceFormat, sourceText }));
          return true;
        },
      clearIssueHighlights:
        () =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          dispatch(tr.setMeta(pluginKey, { clear: true }));
          return true;
        },
      goToIssueByIndex:
        (index: number) =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;
          const st = pluginKey.getState(state) as PluginState;
          const targetItem = findItemByIndex(st.items, index);
          if (targetItem) {
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
      applyIssueByIndex:
        (index: number, replacement?: string) =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;
          const st = pluginKey.getState(state) as PluginState;
          const targetItem = findItemByIndex(st.items, index);
          if (!targetItem) return false;

          const overlaps = (aFrom: number, aTo: number) =>
            !(aTo <= targetItem.from || aFrom >= targetItem.to);
          const overlappingIds = Object.values(st.items)
            .filter((it) => overlaps(it.from, it.to))
            .map((it) => it.id);

          let replacementText = replacement ?? targetItem.suggestion;
          const containsHtml = /<[^>]+>/.test(replacementText);
          if (containsHtml) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = replacementText;
            replacementText = tempDiv.textContent || "";
          }

          const newTr = tr.insertText(replacementText, targetItem.from, targetItem.to);
          const appliedRange: AppliedRange = {
            from: targetItem.from,
            to: targetItem.from + replacementText.length,
          };
          newTr.setMeta(pluginKey, { removeIds: overlappingIds, activeId: null, appliedRange });
          dispatch(newTr);
          return true;
        },
      applyIssuesByIndices:
        (indices: number[], replacement: string) =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;
          if (indices.length === 0) return false;
          const st = pluginKey.getState(state) as PluginState;
          // Build an originalIndex → SuggestItem map once so the per-index lookup is O(1)
          // instead of scanning Object.values(st.items) for every requested index.
          const itemByOriginalIndex = new Map<number, SuggestItem>();
          for (const item of Object.values(st.items)) {
            itemByOriginalIndex.set(item.originalIndex, item);
          }
          const targets = indices
            .map((i) => itemByOriginalIndex.get(i))
            .filter((x): x is SuggestItem => x !== undefined)
            .sort((a, b) => b.from - a.from);
          if (targets.length === 0) return false;

          let replacementText = replacement;
          const containsHtml = /<[^>]+>/.test(replacementText);
          if (containsHtml) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = replacementText;
            replacementText = tempDiv.textContent || "";
          }

          const overlappingIds = findItemIdsOverlappingTargets(st.items, targets);

          const appliedRanges: AppliedRange[] = [];
          let newTr = tr;
          for (const target of targets) {
            newTr = newTr.insertText(replacementText, target.from, target.to);
            appliedRanges.push({
              from: target.from,
              to: target.from + replacementText.length,
            });
          }
          newTr.setMeta(pluginKey, {
            removeIds: overlappingIds,
            activeId: null,
            appliedRanges,
          });
          dispatch(newTr);
          return true;
        },
      setVisibleIssues:
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
      setIssueHighlights: (
        issues: CortexIssueWithId[],
        sourceFormat: IssueSourceFormat,
        sourceText?: string,
      ) => ReturnType;
      clearIssueHighlights: () => ReturnType;
      goToIssueByIndex: (index: number) => ReturnType;
      applyIssueByIndex: (index: number, replacement?: string) => ReturnType;
      applyIssuesByIndices: (indices: number[], replacement: string) => ReturnType;
      setVisibleIssues: (indices: number[]) => ReturnType;
    };
  }
}
