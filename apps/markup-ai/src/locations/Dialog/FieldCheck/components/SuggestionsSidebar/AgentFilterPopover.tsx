/**
 * Agent filter trigger + popover. Replaces the legacy category-checkbox
 * popover with sidebar-app's "All agents / N selected" UX. The set of
 * filterable agents is derived from active issues (so users only see agents
 * that have at least one finding in the current scan).
 */

import React, { useCallback, useMemo, useState } from "react";
import { Checkbox, Popover } from "@contentful/f36-components";
import { CaretDownIcon, FunnelSimpleIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  AGENTS,
  CATEGORIES,
  getFallbackAgent,
  type AgentCategoryID,
} from "../../../../../agents/agents";
import type { CortexIssueWithId } from "../../../../../agents/types";

const CATEGORY_ORDER: AgentCategoryID[] = ["integrity", "compliance", "brand", "geo"];

export interface AgentFilterPopoverProps {
  /** All currently active issues (post-scan, pre-filter) — used to compute available agents. */
  allActiveIssues: readonly CortexIssueWithId[];
  /** `null` means All agents. Otherwise the explicit subset of agent IDs to show. */
  selectedAgentFilterIds: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}

const TriggerButton = styled.button<{ isOpen: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing2Xs};
  height: 26px;
  padding: 0 ${tokens.spacingS};
  border: 1px solid ${tokens.gray300};
  border-radius: 13px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};
  background: ${(p) => (p.isOpen ? tokens.gray100 : tokens.colorWhite)};
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: ${tokens.gray100};
    border-color: ${tokens.gray400};
  }
`;

const PopoverInner = styled.div`
  padding: ${tokens.spacingS};
  min-width: 220px;
  max-height: 320px;
  overflow-y: auto;
`;

const CategoryHeader = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: ${tokens.spacingXs};
  margin-bottom: ${tokens.spacing2Xs};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacing2Xs} 0;
`;

const RowLabel = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray800};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowCount = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
  font-variant-numeric: tabular-nums;
`;

const Divider = styled.div`
  height: 1px;
  background: ${tokens.gray200};
  margin: ${tokens.spacingXs} 0;
`;

interface AgentEntry {
  id: string;
  name: string;
  category: AgentCategoryID | "other";
  count: number;
}

function bucketAgents(activeIssues: readonly CortexIssueWithId[]): {
  byCategory: Record<AgentCategoryID, AgentEntry[]>;
  other: AgentEntry[];
  totalAgents: string[];
} {
  const counts = new Map<string, number>();
  for (const issue of activeIssues) {
    counts.set(issue.agent, (counts.get(issue.agent) ?? 0) + 1);
  }
  const byCategory: Record<AgentCategoryID, AgentEntry[]> = {
    integrity: [],
    compliance: [],
    brand: [],
    geo: [],
  };
  const other: AgentEntry[] = [];
  for (const [agentId, count] of counts) {
    const known = AGENTS.find((a) => a.id === agentId);
    if (known) {
      byCategory[known.category].push({
        id: known.id,
        name: known.name,
        category: known.category,
        count,
      });
    } else {
      const fb = getFallbackAgent(agentId);
      other.push({ id: fb.id, name: fb.name, category: "other", count });
    }
  }
  for (const key of CATEGORY_ORDER) {
    byCategory[key].sort((a, b) => a.name.localeCompare(b.name));
  }
  other.sort((a, b) => a.name.localeCompare(b.name));
  const totalAgents = [...counts.keys()];
  return { byCategory, other, totalAgents };
}

export const AgentFilterPopover: React.FC<AgentFilterPopoverProps> = ({
  allActiveIssues,
  selectedAgentFilterIds,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { byCategory, other, totalAgents } = useMemo(
    () => bucketAgents(allActiveIssues),
    [allActiveIssues],
  );

  const isAllSelected =
    selectedAgentFilterIds === null ||
    (totalAgents.length > 0 && selectedAgentFilterIds.size === totalAgents.length);

  const triggerLabel = isAllSelected
    ? "All agents"
    : `${String(selectedAgentFilterIds.size)} selected`;

  const isAgentChecked = useCallback(
    (id: string) => {
      if (selectedAgentFilterIds === null) return true;
      return selectedAgentFilterIds.has(id);
    },
    [selectedAgentFilterIds],
  );

  const toggleAgent = useCallback(
    (id: string) => {
      const current = selectedAgentFilterIds ?? new Set(totalAgents);
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange(next);
    },
    [selectedAgentFilterIds, totalAgents, onChange],
  );

  const toggleAll = useCallback(() => {
    if (isAllSelected) onChange(new Set());
    else onChange(null);
  }, [isAllSelected, onChange]);

  if (allActiveIssues.length === 0) {
    return (
      <TriggerButton type="button" isOpen={false} disabled style={{ opacity: 0.6 }}>
        <FunnelSimpleIcon />
        All agents
      </TriggerButton>
    );
  }

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <Popover.Trigger>
        <TriggerButton
          type="button"
          isOpen={isOpen}
          onClick={() => {
            setIsOpen((v) => !v);
          }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Filter by agent"
        >
          <FunnelSimpleIcon />
          {triggerLabel}
          <CaretDownIcon />
        </TriggerButton>
      </Popover.Trigger>
      <Popover.Content>
        <PopoverInner>
          <Row>
            <Checkbox isChecked={isAllSelected} onChange={toggleAll}>
              All Agents
            </Checkbox>
            <RowCount>{String(allActiveIssues.length)}</RowCount>
          </Row>
          <Divider />
          {CATEGORY_ORDER.map((catId) => {
            const agents = byCategory[catId];
            if (agents.length === 0) return null;
            const category = CATEGORIES[catId];
            return (
              <div key={catId}>
                <CategoryHeader>{category.name}</CategoryHeader>
                {agents.map((entry) => (
                  <Row key={entry.id}>
                    <Checkbox
                      isChecked={isAgentChecked(entry.id)}
                      onChange={() => {
                        toggleAgent(entry.id);
                      }}
                    >
                      <RowLabel>{entry.name}</RowLabel>
                    </Checkbox>
                    <RowCount>{String(entry.count)}</RowCount>
                  </Row>
                ))}
              </div>
            );
          })}
          {other.length > 0 && (
            <div>
              <CategoryHeader>Other</CategoryHeader>
              {other.map((entry) => (
                <Row key={entry.id}>
                  <Checkbox
                    isChecked={isAgentChecked(entry.id)}
                    onChange={() => {
                      toggleAgent(entry.id);
                    }}
                  >
                    <RowLabel>{entry.name}</RowLabel>
                  </Checkbox>
                  <RowCount>{String(entry.count)}</RowCount>
                </Row>
              ))}
            </div>
          )}
        </PopoverInner>
      </Popover.Content>
    </Popover>
  );
};
