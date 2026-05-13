import React from "react";
import { Flex, Paragraph, Subheading, Switch, Text, Tooltip } from "@contentful/f36-components";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  AGENTS,
  CATEGORIES,
  type AgentCategoryID,
  type AgentID,
} from "../../../../../agents/agents";
import { SELECTABLE_AGENT_BACKEND_IDS } from "../../../../../agents/agenticConfig";
import type { AgentAvailabilityMap } from "../../../../../agents/agentAvailability";
import type { TargetResponse } from "../../../../../api-client/types.gen";
import { SidebarPanelShell } from "../../../../../components/SidebarPanelShell/SidebarPanelShell";
import { DisabledTooltipTarget } from "../../../../../components/DisabledTooltipTarget/DisabledTooltipTarget";
import { AgentConfigField } from "../AgentConfigField";

export interface AgentSettingsPanelProps {
  onBack: () => void;
  selectedAgentIds: AgentID[];
  toggleAgent: (id: AgentID) => void;
  agentConfig: Record<string, Record<string, unknown>>;
  onAgentConfigKeyChange: (agentId: string, key: string, value: unknown) => void;
  /** API key passed to config fields for API-backed option fetches. */
  apiKey?: string | null;
  /**
   * Style guide targets pre-fetched once at the dialog level. Threading them
   * through props avoids a second `/style-agent/targets` call from the panel's
   * target-id selector.
   */
  styleGuideTargets?: TargetResponse[];
  styleGuidesLoading?: boolean;
  styleGuidesError?: boolean;
  /**
   * Org-level / capability-driven unavailability map. Agents in this map
   * render read-only (Switch disabled, reason text + tooltip), but stay
   * visible so users can see what would be available if support enabled
   * them. Defaults to an empty map.
   */
  unavailableAgents?: AgentAvailabilityMap;
}

const CategorySection = styled.div`
  padding: ${tokens.spacingM} 0;

  &:first-of-type {
    padding-top: 0;
  }

  & + & {
    border-top: 1px solid ${tokens.gray200};
  }
`;

const CategoryHeader = styled.div`
  margin-bottom: ${tokens.spacingS};
`;

const AgentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
  padding: ${tokens.spacingS} 0;

  & + & {
    border-top: 1px dashed ${tokens.gray200};
  }
`;

const AgentHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingM};
`;

const AgentConfigArea = styled.div`
  padding-left: ${tokens.spacingM};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

const AgentName = styled(Text)`
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
  line-height: ${tokens.lineHeightM};
`;

const categoryOrder: AgentCategoryID[] = ["brand", "integrity", "compliance", "geo"];

interface AgentRowItemProps {
  agent: (typeof AGENTS)[number];
  isSelected: boolean;
  isRunnable: boolean;
  /** When set, the agent is unavailable (org config / capability) and the row renders read-only. */
  unavailableReason?: string;
  currentConfig: Record<string, unknown>;
  onToggle: () => void;
  onConfigKeyChange: (key: string, value: unknown) => void;
  apiKey?: string | null;
  styleGuideTargets?: TargetResponse[];
  styleGuidesLoading?: boolean;
  styleGuidesError?: boolean;
}

const AgentRowItem: React.FC<AgentRowItemProps> = ({
  agent,
  isSelected,
  isRunnable,
  unavailableReason,
  currentConfig,
  onToggle,
  onConfigKeyChange,
  apiKey,
  styleGuideTargets,
  styleGuidesLoading,
  styleGuidesError,
}) => {
  const isUnavailable = Boolean(unavailableReason);
  // Capability gates (org-level unavailability) and "we don't have a backend
  // for this agent yet" both produce a read-only Switch, but only the
  // former gets a tooltip + reason — "Not yet runnable" is already
  // self-explanatory inline.
  const switchDisabled = !isRunnable || isUnavailable;
  const switchEl = (
    <Switch
      isChecked={isSelected}
      isDisabled={switchDisabled}
      onChange={onToggle}
      aria-label={`Enable ${agent.name}`}
    />
  );
  return (
    <AgentRow>
      <AgentHeaderRow>
        <Flex flexDirection="column">
          <AgentName>{agent.name}</AgentName>
          {!isRunnable && !isUnavailable && (
            <Text fontColor="gray500" fontSize="fontSizeS">
              Not yet runnable
            </Text>
          )}
          {isUnavailable && (
            <Text fontColor="gray500" fontSize="fontSizeS">
              {unavailableReason}
            </Text>
          )}
        </Flex>
        {isUnavailable ? (
          <Tooltip content={unavailableReason} placement="left">
            <DisabledTooltipTarget role="switch">{switchEl}</DisabledTooltipTarget>
          </Tooltip>
        ) : (
          switchEl
        )}
      </AgentHeaderRow>
      {/*
       * We render config fields when the agent is selected even if it's
       * currently unavailable, so the user can see and adjust their saved
       * config (e.g. style guide pick) before support re-enables the agent.
       */}
      {isSelected && agent.configurationKeys.length > 0 && (
        <AgentConfigArea>
          {agent.configurationKeys.map((key) => (
            <AgentConfigField
              key={key}
              configKey={key}
              value={currentConfig[key]}
              onChange={(value) => {
                onConfigKeyChange(key, value);
              }}
              apiKey={apiKey}
              styleGuideTargets={styleGuideTargets}
              styleGuidesLoading={styleGuidesLoading}
              styleGuidesError={styleGuidesError}
            />
          ))}
        </AgentConfigArea>
      )}
    </AgentRow>
  );
};

export const AgentSettingsPanel: React.FC<AgentSettingsPanelProps> = ({
  onBack,
  selectedAgentIds,
  toggleAgent,
  agentConfig,
  onAgentConfigKeyChange,
  apiKey,
  styleGuideTargets,
  styleGuidesLoading,
  styleGuidesError,
  unavailableAgents,
}) => {
  const agentsByCategory = AGENTS.reduce<Partial<Record<AgentCategoryID, typeof AGENTS>>>(
    (acc, agent) => {
      const list = acc[agent.category] ?? [];
      list.push(agent);
      acc[agent.category] = list;
      return acc;
    },
    {},
  );

  return (
    <SidebarPanelShell title="Agent settings" onBack={onBack} backLabel="Back to suggestions">
      <Paragraph>
        Enable the agents you want Markup AI to run on your content. Each agent can have its own
        configuration.
      </Paragraph>

      {categoryOrder.map((categoryId) => {
        const agents = agentsByCategory[categoryId] ?? [];
        if (agents.length === 0) return null;
        const category = CATEGORIES[categoryId];

        return (
          <CategorySection key={categoryId}>
            <CategoryHeader>
              <Subheading>{category.name}</Subheading>
              {category.description && <Text fontColor="gray600">{category.description}</Text>}
            </CategoryHeader>

            {agents.map((agent) => (
              <AgentRowItem
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentIds.includes(agent.id)}
                isRunnable={Boolean(SELECTABLE_AGENT_BACKEND_IDS[agent.id])}
                unavailableReason={unavailableAgents?.get(agent.id)?.reason}
                currentConfig={agentConfig[agent.id] ?? {}}
                onToggle={() => {
                  toggleAgent(agent.id);
                }}
                onConfigKeyChange={(key, value) => {
                  onAgentConfigKeyChange(agent.id, key, value);
                }}
                apiKey={apiKey}
                styleGuideTargets={styleGuideTargets}
                styleGuidesLoading={styleGuidesLoading}
                styleGuidesError={styleGuidesError}
              />
            ))}
          </CategorySection>
        );
      })}
    </SidebarPanelShell>
  );
};
