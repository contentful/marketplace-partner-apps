/**
 * Suggestions sidebar — Contentful port of sidebar-app's agentic layout.
 * Renders a status-text header (HIGH RISK / MEDIUM RISK / etc.), severity
 * progress bar (clickable to open the audit-trail popover), severity pills,
 * agent filter popover, Group/List view toggle, and the issue list (flat or
 * grouped by agent). A gear in the header opens the agent-settings drawer.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, IconButton, Spinner } from "@contentful/f36-components";
import {
  CardsIcon,
  CheckCircleIcon,
  GearSixIcon,
  ListBulletsIcon,
  MinusCircleIcon,
  WarningIcon,
} from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { UserProfileButton } from "../../../../ConfigScreen/components/UserProfileButton";
import type { CortexIssueWithId, CortexSeverity } from "../../../../../agents/types";
import {
  APPLIED_BAR_COLOR,
  DISMISSED_BAR_COLOR,
  SEVERITY_BAR_COLORS,
  SEVERITY_COLORS,
} from "../../../../../utils/scoreColors";
import { SuggestionCard } from "./SuggestionCard";
import { AgentsGroupedList } from "./AgentsGroupedList";
import { AgentFilterPopover } from "./AgentFilterPopover";
import { AuditTrailPopover } from "./AuditTrailPopover";
import {
  SUGGESTIONS_SIDEBAR_DATA_ATTRIBUTE,
  SUGGESTIONS_SIDEBAR_DATA_VALUE,
} from "../../utils/constants";

export type SidebarViewMode = "list" | "grouped";

export interface SuggestionsSidebarProps {
  issues: CortexIssueWithId[];
  filteredIssues: CortexIssueWithId[];
  issueToOriginalIndex: Map<CortexIssueWithId, number>;
  exitingIndices?: Set<number>;
  isLoading: boolean;
  /** True once the user has triggered at least one scan. */
  hasRunScan: boolean;
  /** True when at least one runnable agent is selected in settings. */
  hasEnabledAgent: boolean;
  checkError?: string | null;
  onDismissCheckError?: () => void;
  onCheck: () => void;
  onOpenAgentSettings: () => void;
  onOpenAbout?: () => void;
  onApplyIssue: (issue: CortexIssueWithId, index: number, appliedSuggestion?: string) => void;
  onApplyAllMatching: (issue: CortexIssueWithId, appliedSuggestion?: string) => void;
  onDismissIssue: (issue: CortexIssueWithId, index: number) => void;
  onSelectIssue: (issue: CortexIssueWithId | null, index: number) => void;
  selectedIssueIndex: number | null;
  selectedSeverities: Set<CortexSeverity>;
  onSeverityChange: (severities: Set<CortexSeverity>) => void;
  selectedAgentFilterIds: Set<string> | null;
  onAgentFilterChange: (next: Set<string> | null) => void;
  viewMode: SidebarViewMode;
  onViewModeChange: (next: SidebarViewMode) => void;
  styleAgentApplyAllPeerCountByIssueId: Map<string, number>;
  onSignOut: () => void;
  /** Total number of issues from the initial scan (before any apply/dismiss). */
  totalIssueCount: number;
  appliedCount: number;
  dismissedCount: number;
  /**
   * When set, the Check button is disabled and this string is surfaced via
   * the button's `title` and the status subtext (e.g. "Pick a style guide
   * before running Check"). Lets the parent express domain-specific block
   * reasons without the sidebar caring about each one.
   */
  checkBlockedReason?: string | null;
}

const SEVERITY_OPTIONS: CortexSeverity[] = ["high", "medium", "low"];

type RiskLevel = "high" | "medium" | "low" | "clear" | "analyzing" | "idle" | "error";

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacingS} ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border-bottom: 1px solid ${tokens.gray200};
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
  flex-shrink: 0;
`;

const Logo = styled.img`
  height: 18px;
  width: auto;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const StatusRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacingS};
`;

const StatusText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RISK_TEXT_COLOR: Record<RiskLevel, string> = {
  high: SEVERITY_COLORS.high.text,
  medium: SEVERITY_COLORS.medium.text,
  low: SEVERITY_COLORS.low.text,
  clear: tokens.green700,
  analyzing: tokens.blue600,
  idle: tokens.gray700,
  error: tokens.red700,
};

const RISK_LABELS: Record<RiskLevel, string> = {
  high: "HIGH RISK",
  medium: "MEDIUM RISK",
  low: "LOW RISK",
  clear: "ALL CLEAR",
  analyzing: "ANALYZING…",
  idle: "READY",
  error: "CHECK FAILED",
};

const RiskHeadline = styled.h3<{ riskLevel: RiskLevel }>`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${(p) => RISK_TEXT_COLOR[p.riskLevel]};
  margin: 0;
  line-height: 1.2;
  letter-spacing: 0.5px;
`;

const StatusSubtext = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
  font-weight: ${tokens.fontWeightNormal};
`;

const IssueCountText = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${tokens.spacing2Xs};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};

  strong {
    font-size: ${tokens.fontSizeL};
    font-weight: ${tokens.fontWeightDemiBold};
    color: ${tokens.gray800};
  }
`;

const ProgressBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
`;

const ProgressBarTrigger = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
`;

const ProgressBarTrack = styled.div`
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: ${tokens.gray200};
`;

const ProgressSegment = styled.div<{ widthPercent: number; color: string }>`
  width: ${(p) => p.widthPercent}%;
  height: 100%;
  background: ${(p) => p.color};
  transition: width 0.4s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
`;

const ProgressStatsLeft = styled.span`
  font-weight: ${tokens.fontWeightMedium};
`;

const ProgressStatsRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
`;

const StatItem = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatApplied = styled(StatItem)`
  color: ${tokens.green400};
`;

const StatDismissed = styled(StatItem)`
  color: ${tokens.gray500};
`;

const FiltersRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const SeverityFilters = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  flex-wrap: wrap;
`;

const SeverityPill = styled.button<{
  severity: CortexSeverity;
  isActive: boolean;
  isDisabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing2Xs};
  height: 26px;
  padding: 0 ${tokens.spacingS};
  border: 1px solid;
  border-radius: 13px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  cursor: ${(p) => (p.isDisabled ? "not-allowed" : "pointer")};
  white-space: nowrap;
  opacity: ${(p) => (p.isDisabled ? 0.5 : 1)};
  transition: all 0.15s ease;

  ${(p) => {
    if (p.isDisabled) {
      return `background: ${tokens.gray100}; border-color: ${tokens.gray300}; color: ${tokens.gray500};`;
    }
    const c = SEVERITY_COLORS[p.severity];
    if (p.isActive) {
      return `background: ${c.bg}; border-color: ${c.border}; color: ${c.text};`;
    }
    return `background: ${tokens.colorWhite}; border-color: ${tokens.gray300}; color: ${tokens.gray500};`;
  }}

  &:hover {
    opacity: 0.8;
  }
`;

const SeverityDot = styled.span<{ severity: CortexSeverity }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => SEVERITY_BAR_COLORS[p.severity]};
`;

const FilterControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingS};
  flex-wrap: wrap;
`;

const ViewModeGroup = styled.div`
  display: inline-flex;
  align-items: stretch;
  height: 26px;
  border: 1px solid ${tokens.gray300};
  border-radius: 13px;
  background: ${tokens.gray100};
  padding: 2px;
`;

const ViewModeButton = styled.button<{ isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing2Xs};
  height: 100%;
  padding: 0 ${tokens.spacingS};
  border: none;
  border-radius: 11px;
  background: ${(p) => (p.isActive ? tokens.colorWhite : "transparent")};
  color: ${(p) => (p.isActive ? tokens.gray800 : tokens.gray500)};
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: ${(p) => (p.isActive ? `0 1px 2px rgba(0,0,0,0.08)` : "none")};

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    color: ${tokens.gray800};
  }
`;

const IssueList = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* Reserve scrollbar gutter so card width stays constant whether or not the
     scrollbar is visible (mirrors sidebar-app's scrollbar-gutter-stable). */
  scrollbar-gutter: stable;
  padding: ${tokens.spacingS};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

const EmptyBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${tokens.spacingXl};
  text-align: center;
  color: ${tokens.gray500};
`;

const LoadingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${tokens.spacingXl};
  gap: ${tokens.spacingS};
`;

const ErrorBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${tokens.spacingXl} ${tokens.spacingM};
  text-align: center;
  background: ${tokens.red100};
  border: 1px solid ${tokens.red300};
  border-radius: ${tokens.borderRadiusMedium};
  margin: ${tokens.spacingM};

  svg {
    width: 36px;
    height: 36px;
    color: ${tokens.red600};
    margin-bottom: ${tokens.spacingS};
  }
`;

const SidebarFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
  background: ${tokens.gray100};
  flex-shrink: 0;
`;

function getRiskLevel(
  counts: Record<CortexSeverity, number>,
  isLoading: boolean,
  hasRunScan: boolean,
  hasError: boolean,
): RiskLevel {
  if (isLoading) return "analyzing";
  if (hasError) return "error";
  if (!hasRunScan) return "idle";
  if (counts.high > 0) return "high";
  if (counts.medium > 0) return "medium";
  if (counts.low > 0) return "low";
  return "clear";
}

function getStatusSubtext(
  riskLevel: RiskLevel,
  hasEnabledAgent: boolean,
  appliedCount: number,
  dismissedCount: number,
): string | null {
  if (riskLevel === "analyzing") return "Aggregating findings…";
  if (riskLevel === "idle") {
    return hasEnabledAgent ? "Click Check to analyze" : "Enable an agent in settings to check";
  }
  if (riskLevel === "clear") {
    return appliedCount > 0 || dismissedCount > 0 ? "No issues left" : "No issues detected";
  }
  return null;
}

export const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({
  issues,
  filteredIssues,
  issueToOriginalIndex,
  exitingIndices = new Set(),
  isLoading,
  hasRunScan,
  hasEnabledAgent,
  checkError = null,
  onDismissCheckError,
  onCheck,
  onOpenAgentSettings,
  onOpenAbout,
  onApplyIssue,
  onApplyAllMatching,
  onDismissIssue,
  onSelectIssue,
  selectedIssueIndex,
  selectedSeverities,
  onSeverityChange,
  selectedAgentFilterIds,
  onAgentFilterChange,
  viewMode,
  onViewModeChange,
  styleAgentApplyAllPeerCountByIssueId,
  onSignOut,
  totalIssueCount,
  appliedCount,
  dismissedCount,
  checkBlockedReason = null,
}) => {
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (selectedIssueIndex === null || selectedIssueIndex < 0) return;
    cardRefs.current
      .get(selectedIssueIndex)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedIssueIndex]);

  /**
   * Issues that are still actively shown — excludes items currently sliding out.
   * Counts and progress math use this so that a just-applied / just-dismissed
   * card doesn't double-count (apply increments `appliedCount` immediately while
   * `dismissedIndices` updates after the 300ms exit animation; without this
   * filter the progress bar can transiently exceed 100%).
   */
  const nonExitingIssues = useMemo(() => {
    if (exitingIndices.size === 0) return issues;
    return issues.filter((issue) => {
      const idx = issueToOriginalIndex.get(issue);
      return idx === undefined ? true : !exitingIndices.has(idx);
    });
  }, [issues, exitingIndices, issueToOriginalIndex]);

  const severityCounts = useMemo(() => {
    const counts: Record<CortexSeverity, number> = { high: 0, medium: 0, low: 0 };
    nonExitingIssues.forEach((s) => {
      counts[s.severity] += 1;
    });
    return counts;
  }, [nonExitingIssues]);

  /** Clamp at the UI boundary: parent computes `dismissedIndices.size - appliedCount`,
      which can transiently go negative between `applyIssue` and the 300ms exit timeout. */
  const safeDismissedCount = Math.max(0, dismissedCount);

  const sortedFiltered = useMemo(
    () => [...filteredIssues].sort((a, b) => a.position.start - b.position.start),
    [filteredIssues],
  );

  const toggleSeverity = useCallback(
    (severity: CortexSeverity) => {
      const next = new Set(selectedSeverities);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      onSeverityChange(next);
    },
    [selectedSeverities, onSeverityChange],
  );

  const progressSegments = useMemo(() => {
    if (totalIssueCount === 0) return [];
    const segments: { key: string; widthPercent: number; color: string }[] = [];
    const pct = (count: number) => (count / totalIssueCount) * 100;

    if (appliedCount > 0) {
      segments.push({ key: "applied", widthPercent: pct(appliedCount), color: APPLIED_BAR_COLOR });
    }

    SEVERITY_OPTIONS.forEach((severity) => {
      const count = severityCounts[severity];
      if (count > 0) {
        segments.push({
          key: `remaining-${severity}`,
          widthPercent: pct(count),
          color: SEVERITY_BAR_COLORS[severity],
        });
      }
    });

    if (safeDismissedCount > 0) {
      segments.push({
        key: "dismissed",
        widthPercent: pct(safeDismissedCount),
        color: DISMISSED_BAR_COLOR,
      });
    }

    return segments;
  }, [totalIssueCount, appliedCount, safeDismissedCount, severityCounts]);

  const riskLevel = getRiskLevel(severityCounts, isLoading, hasRunScan, !!checkError);
  const baseSubtext = getStatusSubtext(
    riskLevel,
    hasEnabledAgent,
    appliedCount,
    safeDismissedCount,
  );
  // Surface the parent-supplied block reason on the idle screen so the user
  // sees *why* Check is disabled instead of a silent no-op.
  const subtext =
    !isLoading && riskLevel === "idle" && checkBlockedReason ? checkBlockedReason : baseSubtext;
  const canCheck = hasEnabledAgent && !isLoading && !checkBlockedReason;
  let checkDisabledHint: string | undefined;
  if (checkBlockedReason) {
    checkDisabledHint = checkBlockedReason;
  } else if (!hasEnabledAgent) {
    checkDisabledHint = "Enable an agent in settings to check";
  }
  const remainingCount = nonExitingIssues.length;
  const remainingPlural = remainingCount === 1 ? "" : "s";
  const remainingLabel =
    remainingCount === 0
      ? "No issues remaining"
      : `${String(remainingCount)} issue${remainingPlural} remaining`;

  return (
    <SidebarContainer
      {...{
        [SUGGESTIONS_SIDEBAR_DATA_ATTRIBUTE]: SUGGESTIONS_SIDEBAR_DATA_VALUE,
      }}
    >
      <SidebarHeader>
        <HeaderTop>
          <LogoSection>
            <Logo src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
            <span style={{ fontWeight: 600, color: tokens.gray800 }}>Markup AI</span>
          </LogoSection>
          <HeaderActions>
            <IconButton
              aria-label="Agent settings"
              icon={<GearSixIcon />}
              variant="transparent"
              size="small"
              onClick={onOpenAgentSettings}
            />
          </HeaderActions>
        </HeaderTop>

        <StatusRow>
          <StatusText>
            <RiskHeadline riskLevel={riskLevel}>
              {isLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Spinner size="small" />
                  {RISK_LABELS.analyzing}
                </span>
              ) : (
                RISK_LABELS[riskLevel]
              )}
            </RiskHeadline>
            {subtext && <StatusSubtext>{subtext}</StatusSubtext>}
            {!isLoading && hasRunScan && riskLevel !== "error" && totalIssueCount > 0 && (
              <IssueCountText>
                <strong>{String(totalIssueCount)}</strong> issues found
              </IssueCountText>
            )}
          </StatusText>
          <Button
            variant="primary"
            size="small"
            onClick={onCheck}
            isDisabled={!canCheck}
            title={checkDisabledHint}
          >
            Check
          </Button>
        </StatusRow>

        {!isLoading && !checkError && totalIssueCount > 0 && (
          <ProgressBarContainer>
            <AuditTrailPopover
              isOpen={isAuditTrailOpen}
              onOpenChange={setIsAuditTrailOpen}
              severityCounts={severityCounts}
              appliedCount={appliedCount}
              dismissedCount={safeDismissedCount}
              trigger={
                <ProgressBarTrigger
                  type="button"
                  aria-label="View audit trail"
                  onClick={() => {
                    setIsAuditTrailOpen((v) => !v);
                  }}
                >
                  <ProgressBarTrack>
                    {progressSegments.map((seg) => (
                      <ProgressSegment
                        key={seg.key}
                        widthPercent={seg.widthPercent}
                        color={seg.color}
                      />
                    ))}
                  </ProgressBarTrack>
                </ProgressBarTrigger>
              }
            />
            <ProgressStats>
              <ProgressStatsLeft>{remainingLabel}</ProgressStatsLeft>
              <ProgressStatsRight>
                {appliedCount > 0 && (
                  <StatApplied title="Applied">
                    <CheckCircleIcon /> {String(appliedCount)}
                  </StatApplied>
                )}
                {safeDismissedCount > 0 && (
                  <StatDismissed title="Dismissed">
                    <MinusCircleIcon /> {String(safeDismissedCount)}
                  </StatDismissed>
                )}
              </ProgressStatsRight>
            </ProgressStats>
          </ProgressBarContainer>
        )}

        {hasRunScan && !checkError && (
          <FiltersRow>
            <SeverityFilters>
              {SEVERITY_OPTIONS.map((severity) => (
                <SeverityPill
                  key={severity}
                  severity={severity}
                  isActive={selectedSeverities.has(severity)}
                  isDisabled={isLoading}
                  onClick={() => {
                    if (!isLoading) toggleSeverity(severity);
                  }}
                  title={`${severity.charAt(0).toUpperCase()}${severity.slice(1)} severity`}
                >
                  <SeverityDot severity={severity} />
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}{" "}
                  {isLoading ? "-" : String(severityCounts[severity])}
                </SeverityPill>
              ))}
            </SeverityFilters>
            <FilterControlsRow>
              <AgentFilterPopover
                allActiveIssues={issues}
                selectedAgentFilterIds={selectedAgentFilterIds}
                onChange={onAgentFilterChange}
              />
              <ViewModeGroup role="group" aria-label="Issue view">
                <ViewModeButton
                  type="button"
                  isActive={viewMode === "grouped"}
                  onClick={() => {
                    onViewModeChange("grouped");
                  }}
                  aria-pressed={viewMode === "grouped"}
                >
                  <CardsIcon />
                  Group
                </ViewModeButton>
                <ViewModeButton
                  type="button"
                  isActive={viewMode === "list"}
                  onClick={() => {
                    onViewModeChange("list");
                  }}
                  aria-pressed={viewMode === "list"}
                >
                  <ListBulletsIcon />
                  List
                </ViewModeButton>
              </ViewModeGroup>
            </FilterControlsRow>
          </FiltersRow>
        )}
      </SidebarHeader>

      <IssueList>
        {(() => {
          if (isLoading) {
            return (
              <LoadingBlock>
                <Spinner size="medium" />
                <span>Analyzing content…</span>
              </LoadingBlock>
            );
          }
          if (checkError) {
            return (
              <ErrorBlock role="alert" aria-live="polite">
                <WarningIcon />
                <strong>Check failed</strong>
                <p
                  style={{
                    margin: `${tokens.spacing2Xs} 0 ${tokens.spacingM}`,
                    fontSize: tokens.fontSizeS,
                  }}
                >
                  {checkError}
                </p>
                <div style={{ display: "flex", gap: tokens.spacingS, flexWrap: "wrap" }}>
                  <Button variant="primary" size="small" onClick={onCheck}>
                    Try again
                  </Button>
                  {onDismissCheckError && (
                    <Button variant="secondary" size="small" onClick={onDismissCheckError}>
                      Dismiss
                    </Button>
                  )}
                </div>
              </ErrorBlock>
            );
          }
          if (!hasRunScan) {
            return (
              <EmptyBlock>
                <strong style={{ marginTop: tokens.spacingS }}>Ready to analyze</strong>
                <span style={{ marginTop: tokens.spacing2Xs, maxWidth: 280 }}>
                  {hasEnabledAgent
                    ? "Click Check above to run your selected agents."
                    : "Open Agent settings to enable at least one agent, then Check."}
                </span>
              </EmptyBlock>
            );
          }
          if (issues.length === 0) {
            return (
              <EmptyBlock>
                <CheckCircleIcon size="medium" />
                <strong style={{ marginTop: tokens.spacingS }}>Everything looks great!</strong>
                <span style={{ marginTop: tokens.spacing2Xs }}>Zero issues found.</span>
              </EmptyBlock>
            );
          }
          if (sortedFiltered.length === 0) {
            return <EmptyBlock>No suggestions match your filters.</EmptyBlock>;
          }
          if (viewMode === "grouped") {
            return (
              <AgentsGroupedList
                issues={sortedFiltered}
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
            );
          }
          return sortedFiltered.map((issue) => {
            const originalIndex = issueToOriginalIndex.get(issue) ?? -1;
            const isExiting = exitingIndices.has(originalIndex);
            return (
              <SuggestionCard
                key={`issue-${issue.id}`}
                ref={(el) => {
                  if (el) cardRefs.current.set(originalIndex, el);
                  else cardRefs.current.delete(originalIndex);
                }}
                issue={issue}
                isExpanded={selectedIssueIndex === originalIndex}
                isExiting={isExiting}
                onExpand={() => {
                  if (selectedIssueIndex !== originalIndex) {
                    onSelectIssue(issue, originalIndex);
                  }
                }}
                onApply={(appliedSuggestion) => {
                  onApplyIssue(issue, originalIndex, appliedSuggestion);
                }}
                styleAgentApplyAllPeerCount={styleAgentApplyAllPeerCountByIssueId.get(issue.id)}
                onApplyAllMatching={(appliedSuggestion) => {
                  onApplyAllMatching(issue, appliedSuggestion);
                }}
                onDismiss={() => {
                  onDismissIssue(issue, originalIndex);
                }}
              />
            );
          });
        })()}
      </IssueList>

      <SidebarFooter>
        <UserProfileButton
          onSignOut={onSignOut}
          hideSignInPrompt
          dropdownPosition="above"
          onOpenAbout={onOpenAbout}
        />
      </SidebarFooter>
    </SidebarContainer>
  );
};
