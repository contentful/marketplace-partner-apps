/**
 * Grouped view: issues bucketed by category and per-agent. Each agent block
 * is a collapsible section (closed by default unless it's the only agent in
 * the run). Mirrors sidebar-app's AgenticAgentsList layout, but trimmed —
 * Contentful's flow has no scan-time agent snapshotting, so we just group
 * what we have.
 */

import React, { forwardRef, useMemo, useState } from "react";
import { CaretDownIcon, CaretRightIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  AGENTS,
  CATEGORIES,
  getAgentByID,
  getFallbackAgent,
  type AgentCategoryID,
} from "../../../../../agents/agents";
import type { CortexIssueWithId } from "../../../../../agents/types";
import { SuggestionCard } from "./SuggestionCard";

const CATEGORY_ORDER: AgentCategoryID[] = ["integrity", "compliance", "brand", "geo"];

export interface AgentsGroupedListProps {
  issues: CortexIssueWithId[];
  issueToOriginalIndex: Map<CortexIssueWithId, number>;
  exitingIndices: Set<number>;
  selectedIssueIndex: number | null;
  onSelectIssue: (issue: CortexIssueWithId | null, index: number) => void;
  onApplyIssue: (issue: CortexIssueWithId, index: number, appliedSuggestion?: string) => void;
  onApplyAllMatching: (issue: CortexIssueWithId, appliedSuggestion?: string) => void;
  onDismissIssue: (issue: CortexIssueWithId, index: number) => void;
  styleAgentApplyAllPeerCountByIssueId: Map<string, number>;
  cardRefs: React.RefObject<Map<number, HTMLDivElement>>;
}

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

const CategoryTitle = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: ${tokens.spacingS};

  &:first-of-type {
    margin-top: 0;
  }
`;

const AgentBlock = styled.div`
  border: 1px solid ${tokens.gray200};
  border-radius: ${tokens.borderRadiusMedium};
  background: ${tokens.colorWhite};
  overflow: hidden;
`;

const AgentHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingS};
  background: transparent;
  border: none;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  cursor: pointer;
  text-align: left;
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};

  &:hover {
    background: ${tokens.gray100};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const AgentHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const AgentCount = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
  font-weight: ${tokens.fontWeightNormal};
  font-variant-numeric: tabular-nums;
`;

const AgentBody = styled.div`
  border-top: 1px solid ${tokens.gray200};
  padding: ${tokens.spacingS};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
  background: ${tokens.gray100};
`;

const EmptyMsg = styled.div`
  padding: ${tokens.spacingM};
  text-align: center;
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
`;

interface AgentBucket {
  agentId: string;
  agentName: string;
  category: AgentCategoryID | "other";
  issues: CortexIssueWithId[];
}

function bucketIssues(issues: CortexIssueWithId[]): AgentBucket[] {
  const map = new Map<string, AgentBucket>();
  for (const issue of issues) {
    let bucket = map.get(issue.agent);
    if (!bucket) {
      const known = AGENTS.find((a) => a.id === issue.agent) ?? getAgentByID(issue.agent);
      const meta = known ?? getFallbackAgent(issue.agent);
      const category = AGENTS.some((a) => a.id === meta.id) ? meta.category : "other";
      bucket = {
        agentId: issue.agent,
        agentName: meta.name,
        category,
        issues: [],
      };
      map.set(issue.agent, bucket);
    }
    bucket.issues.push(issue);
  }
  return [...map.values()];
}

interface AgentSectionProps {
  bucket: AgentBucket;
  defaultOpen: boolean;
  issueToOriginalIndex: Map<CortexIssueWithId, number>;
  exitingIndices: Set<number>;
  selectedIssueIndex: number | null;
  onSelectIssue: AgentsGroupedListProps["onSelectIssue"];
  onApplyIssue: AgentsGroupedListProps["onApplyIssue"];
  onApplyAllMatching: AgentsGroupedListProps["onApplyAllMatching"];
  onDismissIssue: AgentsGroupedListProps["onDismissIssue"];
  styleAgentApplyAllPeerCountByIssueId: Map<string, number>;
  cardRefs: AgentsGroupedListProps["cardRefs"];
}

const AgentSection: React.FC<AgentSectionProps> = ({
  bucket,
  defaultOpen,
  issueToOriginalIndex,
  exitingIndices,
  selectedIssueIndex,
  onSelectIssue,
  onApplyIssue,
  onApplyAllMatching,
  onDismissIssue,
  styleAgentApplyAllPeerCountByIssueId,
  cardRefs,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sorted = useMemo(
    () => [...bucket.issues].sort((a, b) => a.position.start - b.position.start),
    [bucket.issues],
  );

  return (
    <AgentBlock>
      <AgentHeader
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
        }}
        aria-expanded={isOpen}
      >
        <AgentHeaderLeft>
          {isOpen ? <CaretDownIcon /> : <CaretRightIcon />}
          {bucket.agentName}
        </AgentHeaderLeft>
        <AgentCount>
          {String(bucket.issues.length)} issue
          {bucket.issues.length === 1 ? "" : "s"}
        </AgentCount>
      </AgentHeader>
      {isOpen && (
        <AgentBody>
          {sorted.map((issue) => {
            const originalIndex = issueToOriginalIndex.get(issue) ?? -1;
            const isExiting = exitingIndices.has(originalIndex);
            return (
              <SuggestionCard
                key={`grouped-${issue.id}`}
                ref={(el: HTMLDivElement | null) => {
                  if (el) cardRefs.current.set(originalIndex, el);
                  else cardRefs.current.delete(originalIndex);
                }}
                issue={issue}
                isExpanded={selectedIssueIndex === originalIndex}
                isExiting={isExiting}
                hideAgentBadge
                onExpand={() => {
                  if (selectedIssueIndex !== originalIndex) {
                    onSelectIssue(issue, originalIndex);
                  }
                }}
                onApply={(appliedSuggestion) => {
                  onApplyIssue(issue, originalIndex, appliedSuggestion);
                }}
                onDismiss={() => {
                  onDismissIssue(issue, originalIndex);
                }}
                styleAgentApplyAllPeerCount={styleAgentApplyAllPeerCountByIssueId.get(issue.id)}
                onApplyAllMatching={(appliedSuggestion) => {
                  onApplyAllMatching(issue, appliedSuggestion);
                }}
              />
            );
          })}
        </AgentBody>
      )}
    </AgentBlock>
  );
};

export const AgentsGroupedList = forwardRef<HTMLDivElement, AgentsGroupedListProps>(
  (
    {
      issues,
      issueToOriginalIndex,
      exitingIndices,
      selectedIssueIndex,
      onSelectIssue,
      onApplyIssue,
      onApplyAllMatching,
      onDismissIssue,
      styleAgentApplyAllPeerCountByIssueId,
      cardRefs,
    },
    ref,
  ) => {
    const buckets = useMemo(() => bucketIssues(issues), [issues]);
    const onlyOne = buckets.length === 1;

    const byCategory = useMemo(() => {
      const map = new Map<AgentCategoryID | "other", AgentBucket[]>();
      for (const b of buckets) {
        const list = map.get(b.category) ?? [];
        list.push(b);
        map.set(b.category, list);
      }
      return map;
    }, [buckets]);

    if (buckets.length === 0) {
      return <EmptyMsg>No suggestions match your filters.</EmptyMsg>;
    }

    return (
      <Section ref={ref}>
        {CATEGORY_ORDER.map((catId) => {
          const list = byCategory.get(catId);
          if (!list || list.length === 0) return null;
          return (
            <React.Fragment key={catId}>
              <CategoryTitle>{CATEGORIES[catId].name}</CategoryTitle>
              {list.map((bucket) => (
                <AgentSection
                  key={bucket.agentId}
                  bucket={bucket}
                  defaultOpen={onlyOne}
                  issueToOriginalIndex={issueToOriginalIndex}
                  exitingIndices={exitingIndices}
                  selectedIssueIndex={selectedIssueIndex}
                  onSelectIssue={onSelectIssue}
                  onApplyIssue={onApplyIssue}
                  onApplyAllMatching={onApplyAllMatching}
                  onDismissIssue={onDismissIssue}
                  styleAgentApplyAllPeerCountByIssueId={styleAgentApplyAllPeerCountByIssueId}
                  cardRefs={cardRefs}
                />
              ))}
            </React.Fragment>
          );
        })}
        {(() => {
          const otherList = byCategory.get("other");
          if (!otherList || otherList.length === 0) return null;
          return (
            <>
              <CategoryTitle>Other</CategoryTitle>
              {otherList.map((bucket) => (
                <AgentSection
                  key={bucket.agentId}
                  bucket={bucket}
                  defaultOpen={onlyOne}
                  issueToOriginalIndex={issueToOriginalIndex}
                  exitingIndices={exitingIndices}
                  selectedIssueIndex={selectedIssueIndex}
                  onSelectIssue={onSelectIssue}
                  onApplyIssue={onApplyIssue}
                  onApplyAllMatching={onApplyAllMatching}
                  onDismissIssue={onDismissIssue}
                  styleAgentApplyAllPeerCountByIssueId={styleAgentApplyAllPeerCountByIssueId}
                  cardRefs={cardRefs}
                />
              ))}
            </>
          );
        })()}
      </Section>
    );
  },
);

AgentsGroupedList.displayName = "AgentsGroupedList";
