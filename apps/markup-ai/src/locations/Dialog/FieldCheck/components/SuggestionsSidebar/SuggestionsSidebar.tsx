/**
 * Suggestions Sidebar component
 * Shows risk level, filters, and list of suggestion cards
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button, IconButton, Spinner, Popover, Select, Checkbox } from "@contentful/f36-components";
import {
  GearSixIcon,
  ListBulletsIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@contentful/f36-icons";
import { UserProfileButton } from "../../../../ConfigScreen/components/UserProfileButton";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { Severity } from "../../../../../api-client/types.gen";
import type {
  Suggestion,
  ConstantsResponse,
  StyleGuideResponse,
  Dialects,
  Tones,
} from "../../../../../api-client/types.gen";
import {
  SEVERITY_COLORS,
  SEVERITY_BAR_COLORS,
  APPLIED_BAR_COLOR,
  DISMISSED_BAR_COLOR,
} from "../../../../../utils/scoreColors";
import { SuggestionCard, type FeedbackPayload } from "./SuggestionCard";
import { formatDialect, formatTone } from "../../utils/format";
import {
  FILTER_CATEGORY_OPTIONS,
  SUGGESTIONS_SIDEBAR_DATA_ATTRIBUTE,
  SUGGESTIONS_SIDEBAR_DATA_VALUE,
} from "../../utils/constants";

export interface SuggestionsSidebarProps {
  /** All suggestions (unfiltered, but dismissed ones removed) */
  suggestions: Suggestion[];
  /** Filtered suggestions to display in the list */
  filteredSuggestions: Suggestion[];
  /** Map from suggestion to its original index in activeSuggestions */
  suggestionToOriginalIndex: Map<Suggestion, number>;
  /** Set of indices that are currently exiting (animating out) */
  exitingIndices?: Set<number>;
  isLoading: boolean;
  onCheck: () => void;
  onApplySuggestion: (suggestion: Suggestion, index: number) => void;
  onDismissSuggestion: (suggestion: Suggestion, index: number) => void;
  onSelectSuggestion: (suggestion: Suggestion | null, index: number) => void;
  selectedSuggestionIndex: number | null;
  // Filter state (controlled by parent for sync with editor)
  selectedCategories: Set<string>;
  selectedSeverities: Set<Severity>;
  onCategoryChange: (categories: Set<string>) => void;
  onSeverityChange: (severities: Set<Severity>) => void;
  // Config props
  config: {
    dialect?: Dialects;
    tone?: Tones | null;
    styleGuide?: string;
  };
  onConfigChange: (config: {
    dialect?: Dialects;
    tone?: Tones | null;
    styleGuide?: string;
  }) => void;
  constants?: ConstantsResponse;
  styleGuides?: StyleGuideResponse[];
  // User actions
  onSignOut: () => void;
  // Feedback
  onSubmitFeedback?: (payload: FeedbackPayload, suggestionIndex: number) => Promise<void>;
  isFeedbackLoading?: boolean;
  // Progress tracking
  /** Total number of issues from the initial analysis (before any apply/dismiss) */
  totalIssueCount: number;
  /** Number of suggestions the user explicitly applied */
  appliedCount: number;
  /** Number of suggestions dismissed (manually or from overlapping issues on apply) */
  dismissedCount: number;
}

// Styled components
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
  padding: ${tokens.spacingS} ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border-bottom: 1px solid ${tokens.gray200};
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${tokens.spacingS};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
`;

const Logo = styled.img`
  height: 20px;
  width: auto;
`;

// Risk level types
type RiskLevel = "high" | "medium" | "low" | "clear" | "analyzing";

const getRiskLevel = (
  highCount: number,
  mediumCount: number,
  _lowCount: number,
  isLoading: boolean,
): RiskLevel => {
  if (isLoading) return "analyzing";
  if (highCount > 0) return "high";
  if (mediumCount > 0) return "medium";
  if (_lowCount > 0) return "low";
  return "clear";
};

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; badge: string }> = {
  high: {
    bg: SEVERITY_COLORS[Severity.HIGH].text,
    text: SEVERITY_COLORS[Severity.HIGH].text,
    badge: SEVERITY_COLORS[Severity.HIGH].text,
  },
  medium: {
    bg: SEVERITY_COLORS[Severity.MEDIUM].text,
    text: SEVERITY_COLORS[Severity.MEDIUM].text,
    badge: SEVERITY_COLORS[Severity.MEDIUM].text,
  },
  low: {
    bg: SEVERITY_COLORS[Severity.LOW].text,
    text: SEVERITY_COLORS[Severity.LOW].text,
    badge: SEVERITY_COLORS[Severity.LOW].text,
  },
  clear: { bg: "#2e7d32", text: "#2e7d32", badge: "#2e7d32" },
  analyzing: { bg: tokens.gray400, text: tokens.gray600, badge: tokens.gray400 },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  high: "HIGH RISK",
  medium: "MEDIUM RISK",
  low: "LOW RISK",
  clear: "ALL CLEAR",
  analyzing: "ANALYZING...",
};

const ScoreSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacingM};
  margin-bottom: ${tokens.spacingS};
`;

const RiskInfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingM};
`;

const RiskBadge = styled.div<{ riskLevel: RiskLevel }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${tokens.borderRadiusMedium};
  font-size: 24px;
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.colorWhite};
  background: ${(props) => RISK_COLORS[props.riskLevel].badge};
  flex-shrink: 0;
`;

const RiskDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RiskLevelText = styled.span<{ riskLevel: RiskLevel }>`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${(props) => RISK_COLORS[props.riskLevel].text};
  line-height: 1.2;
`;

const IssueCountText = styled.span`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
`;

const CheckButton = styled(Button)`
  flex-shrink: 0;
`;

// All Clear celebration state
const PerfectScoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingXl} ${tokens.spacingM};
  text-align: center;
`;

const PerfectScoreIcon = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${tokens.spacingM};

  svg {
    width: 64px;
    height: 64px;
    color: #2e7d32;
  }

  /* Decorative sparkles */
  &::before,
  &::after {
    content: "+";
    position: absolute;
    font-size: 16px;
    font-weight: bold;
    color: #1976d2;
  }

  &::before {
    top: 0;
    right: 0;
  }

  &::after {
    bottom: 0;
    left: 0;
  }
`;

const PerfectScoreTitle = styled.h3`
  font-size: ${tokens.fontSizeXl};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray900};
  margin: 0 0 ${tokens.spacingXs} 0;
`;

const PerfectScoreSubtitle = styled.p`
  font-size: ${tokens.fontSizeM};
  color: ${tokens.gray600};
  margin: 0 0 ${tokens.spacingXs} 0;
`;

const PerfectScoreLink = styled.span`
  font-size: ${tokens.fontSizeM};
  color: #2e7d32;
`;

// --- Issue Progress Bar ---
const ProgressBarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
  margin-bottom: ${tokens.spacingS};
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
  width: ${(props) => props.widthPercent}%;
  height: 100%;
  background: ${(props) => props.color};
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

// --- End Issue Progress Bar ---

const SuggestionsFiltersRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SeverityFilters = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const SeverityPill = styled.button<{ severity: Severity; isActive: boolean; isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${tokens.spacing2Xs};
  height: 26px;
  padding: 0 ${tokens.spacingS};
  border: 1px solid;
  border-radius: 13px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  cursor: ${(props) => (props.isDisabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  white-space: nowrap;
  opacity: ${(props) => (props.isDisabled ? 0.5 : 1)};

  ${(props) => {
    const { severity, isActive, isDisabled } = props;

    if (isDisabled) {
      return `
        background: ${tokens.gray100};
        border-color: ${tokens.gray300};
        color: ${tokens.gray500};
      `;
    }

    const c = SEVERITY_COLORS[severity];

    if (isActive) {
      return `
        background: ${c.bg};
        border-color: ${c.border};
        color: ${c.text};
      `;
    }
    return `
      background: ${tokens.colorWhite};
      border-color: ${tokens.gray300};
      color: ${tokens.gray500};
    `;
  }}

  &:hover {
    opacity: 0.8;
  }
`;

const FilterPopoverContent = styled.div`
  padding: ${tokens.spacingS};
  min-width: 180px;
`;

const FilterPopoverTitle = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  margin-bottom: ${tokens.spacingS};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterCheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const FilterCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FilterCount = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
`;

const SuggestionsList = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${tokens.spacingS};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};

  /* Ensure scrollbar is always visible when content overflows */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${tokens.gray100};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${tokens.gray400};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${tokens.gray500};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingXl};
  text-align: center;
  color: ${tokens.gray500};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${tokens.spacingXl};
  gap: ${tokens.spacingS};
`;

const SidebarFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
  background: ${tokens.gray100};
  flex-shrink: 0;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
`;

const SettingsPopoverContent = styled.div`
  padding: ${tokens.spacingM};
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingM};
`;

const SettingsField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const SettingsLabel = styled.label`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};
`;

// Severity options for filtering (using API enum values)
const SEVERITY_OPTIONS: Severity[] = [Severity.HIGH, Severity.MEDIUM, Severity.LOW];

export const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({
  suggestions,
  filteredSuggestions,
  suggestionToOriginalIndex,
  exitingIndices = new Set(),
  isLoading,
  onCheck,
  onApplySuggestion,
  onDismissSuggestion,
  onSelectSuggestion,
  selectedSuggestionIndex,
  selectedCategories,
  selectedSeverities,
  onCategoryChange,
  onSeverityChange,
  config,
  onConfigChange,
  constants,
  styleGuides,
  onSignOut,
  onSubmitFeedback,
  isFeedbackLoading,
  totalIssueCount,
  appliedCount,
  dismissedCount,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Refs for card elements to enable scroll-to-view
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll the selected card into view when selectedSuggestionIndex changes
  useEffect(() => {
    if (selectedSuggestionIndex === null || selectedSuggestionIndex < 0) return;

    const cardEl = cardRefs.current.get(selectedSuggestionIndex);
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedSuggestionIndex]);

  // Count suggestions by severity (from all visible suggestions, not filtered)
  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0,
    };
    suggestions.forEach((s) => {
      if (s.severity in counts) {
        counts[s.severity]++;
      }
    });
    return counts;
  }, [suggestions]);

  // Count suggestions by category (from all visible suggestions, not filtered)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    suggestions.forEach((s) => {
      const cat = s.category?.toLowerCase() || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [suggestions]);

  // Sort filtered suggestions by start offset (ascending order)
  const sortedFilteredSuggestions = useMemo(() => {
    return [...filteredSuggestions].sort((a, b) => a.position.start_index - b.position.start_index);
  }, [filteredSuggestions]);

  // Toggle category filter
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const next = new Set(selectedCategories);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      onCategoryChange(next);
    },
    [selectedCategories, onCategoryChange],
  );

  // Toggle severity filter
  const toggleSeverity = useCallback(
    (severity: Severity) => {
      const next = new Set(selectedSeverities);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      onSeverityChange(next);
    },
    [selectedSeverities, onSeverityChange],
  );

  // Progress bar segments: applied (green) | remaining-by-severity | dismissed (gray)
  const progressSegments = useMemo(() => {
    if (totalIssueCount === 0) return [];

    const segments: { key: string; widthPercent: number; color: string }[] = [];
    const pct = (count: number) => (count / totalIssueCount) * 100;

    // 1. Applied (green) - first so it grows from the left
    if (appliedCount > 0) {
      segments.push({ key: "applied", widthPercent: pct(appliedCount), color: APPLIED_BAR_COLOR });
    }

    // 2. Remaining by severity (ordered high -> medium -> low)
    const remainingSeverityCounts: Record<Severity, number> = {
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0,
    };
    suggestions.forEach((s) => {
      if (s.severity in remainingSeverityCounts) {
        remainingSeverityCounts[s.severity]++;
      }
    });

    for (const severity of SEVERITY_OPTIONS) {
      const count = remainingSeverityCounts[severity];
      if (count > 0) {
        segments.push({
          key: `remaining-${severity}`,
          widthPercent: pct(count),
          color: SEVERITY_BAR_COLORS[severity],
        });
      }
    }

    // 3. Dismissed (gray) - at the end
    if (dismissedCount > 0) {
      segments.push({
        key: "dismissed",
        widthPercent: pct(dismissedCount),
        color: DISMISSED_BAR_COLOR,
      });
    }

    return segments;
  }, [totalIssueCount, appliedCount, dismissedCount, suggestions]);

  const remainingCount = suggestions.length;

  // Calculate risk level based on severity counts
  const riskLevel = getRiskLevel(
    severityCounts[Severity.HIGH],
    severityCounts[Severity.MEDIUM],
    severityCounts[Severity.LOW],
    isLoading,
  );

  // Build config options
  const dialectOptions = (constants?.dialects || []).map((d) => ({
    value: d,
    label: formatDialect(d) || d,
  }));

  const toneOptions = [
    { value: "", label: "None" },
    ...(constants?.tones || []).map((t) => ({
      value: t,
      label: formatTone(t) || t,
    })),
  ];

  const styleGuideOptions = (styleGuides || []).map((sg) => ({
    value: sg.id,
    label: sg.name,
  }));

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
        </HeaderTop>

        <ScoreSection>
          <RiskInfoSection>
            <RiskBadge riskLevel={riskLevel}>
              {(() => {
                if (riskLevel === "clear") return <CheckCircleIcon />;
                if (riskLevel === "analyzing") return <Spinner size="medium" />;
                return riskLevel.charAt(0).toUpperCase();
              })()}
            </RiskBadge>
            <RiskDetails>
              <RiskLevelText riskLevel={riskLevel}>{RISK_LABELS[riskLevel]}</RiskLevelText>
              {!isLoading && (
                <IssueCountText>
                  {(() => {
                    if (suggestions.length === 0) return "No issues detected";
                    const plural = suggestions.length === 1 ? "" : "s";
                    return `${String(suggestions.length)} issue${plural} detected`;
                  })()}
                </IssueCountText>
              )}
            </RiskDetails>
          </RiskInfoSection>
          <CheckButton variant="primary" size="small" onClick={onCheck} isDisabled={isLoading}>
            Check
          </CheckButton>
        </ScoreSection>

        {/* Issue Progress Bar - shown when there are issues to track */}
        {!isLoading && totalIssueCount > 0 && (
          <ProgressBarSection>
            <ProgressBarTrack>
              {progressSegments.map((seg) => (
                <ProgressSegment key={seg.key} widthPercent={seg.widthPercent} color={seg.color} />
              ))}
            </ProgressBarTrack>
            <ProgressStats>
              <ProgressStatsLeft>
                {remainingCount === 0
                  ? "No issues remaining"
                  : `${String(remainingCount)} issue${remainingCount === 1 ? "" : "s"} remaining`}
              </ProgressStatsLeft>
              <ProgressStatsRight>
                {appliedCount > 0 && (
                  <StatApplied title="Applied">
                    <CheckCircleIcon /> {String(appliedCount)}
                  </StatApplied>
                )}
                {dismissedCount > 0 && (
                  <StatDismissed title="Dismissed">
                    <MinusCircleIcon /> {String(dismissedCount)}
                  </StatDismissed>
                )}
              </ProgressStatsRight>
            </ProgressStats>
          </ProgressBarSection>
        )}

        <SuggestionsFiltersRow>
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
                title={`${severity.charAt(0).toUpperCase()}${severity.slice(1).toLowerCase()} severity`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()}{" "}
                {isLoading ? "-" : String(severityCounts[severity])}
              </SeverityPill>
            ))}
          </SeverityFilters>
          <Popover
            isOpen={isFilterOpen}
            onClose={() => {
              setIsFilterOpen(false);
            }}
          >
            <Popover.Trigger>
              <IconButton
                aria-label="Filter by category"
                icon={<ListBulletsIcon />}
                variant="transparent"
                size="small"
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                }}
              />
            </Popover.Trigger>
            <Popover.Content>
              <FilterPopoverContent>
                <FilterPopoverTitle>Suggestion Type</FilterPopoverTitle>
                <FilterCheckboxGroup>
                  {FILTER_CATEGORY_OPTIONS.map((cat) => (
                    <FilterCheckboxRow key={cat.id}>
                      <Checkbox
                        id={`filter-${cat.id}`}
                        isChecked={selectedCategories.has(cat.id)}
                        onChange={() => {
                          toggleCategory(cat.id);
                        }}
                      >
                        {cat.label}
                      </Checkbox>
                      <FilterCount>({categoryCounts[cat.id] || 0})</FilterCount>
                    </FilterCheckboxRow>
                  ))}
                </FilterCheckboxGroup>
              </FilterPopoverContent>
            </Popover.Content>
          </Popover>
        </SuggestionsFiltersRow>
      </SidebarHeader>

      <SuggestionsList>
        {(() => {
          if (isLoading) {
            return (
              <LoadingState>
                <Spinner size="medium" />
                <span>Analyzing content...</span>
              </LoadingState>
            );
          }
          if (suggestions.length === 0) {
            return (
              <PerfectScoreContainer>
                <PerfectScoreIcon>
                  <CheckCircleIcon />
                </PerfectScoreIcon>
                <PerfectScoreTitle>Everything looks great!</PerfectScoreTitle>
                <PerfectScoreSubtitle>Your content is polished and ready.</PerfectScoreSubtitle>
                <PerfectScoreLink>Zero issues found.</PerfectScoreLink>
              </PerfectScoreContainer>
            );
          }
          if (sortedFilteredSuggestions.length === 0) {
            return <EmptyState>No suggestions match your filters.</EmptyState>;
          }
          return sortedFilteredSuggestions.map((suggestion) => {
            // Get the original index from the map (index in activeSuggestions)
            const originalIndex = suggestionToOriginalIndex.get(suggestion) ?? -1;
            const isExiting = exitingIndices.has(originalIndex);
            return (
              <SuggestionCard
                key={`suggestion-${String(originalIndex)}-${String(suggestion.position.start_index)}`}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(originalIndex, el);
                  } else {
                    cardRefs.current.delete(originalIndex);
                  }
                }}
                suggestion={suggestion}
                isExpanded={selectedSuggestionIndex === originalIndex}
                isExiting={isExiting}
                onToggle={() => {
                  if (selectedSuggestionIndex === originalIndex) {
                    onSelectSuggestion(null, -1);
                  } else {
                    onSelectSuggestion(suggestion, originalIndex);
                  }
                }}
                onApply={() => {
                  onApplySuggestion(suggestion, originalIndex);
                }}
                onDismiss={() => {
                  onDismissSuggestion(suggestion, originalIndex);
                }}
                onSubmitFeedback={
                  onSubmitFeedback
                    ? (payload) => onSubmitFeedback(payload, originalIndex)
                    : undefined
                }
                isFeedbackLoading={isFeedbackLoading}
              />
            );
          });
        })()}
      </SuggestionsList>

      <SidebarFooter>
        <FooterLeft>
          <Popover
            isOpen={isSettingsOpen}
            onClose={() => {
              setIsSettingsOpen(false);
            }}
          >
            <Popover.Trigger>
              <IconButton
                aria-label="Settings"
                icon={<GearSixIcon />}
                variant="transparent"
                size="small"
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                }}
              />
            </Popover.Trigger>
            <Popover.Content>
              <SettingsPopoverContent>
                <SettingsField>
                  <SettingsLabel>Style Guide</SettingsLabel>
                  <Select
                    aria-label="Style Guide"
                    value={config.styleGuide || styleGuideOptions[0]?.value || ""}
                    onChange={(e) => {
                      onConfigChange({ styleGuide: e.target.value });
                    }}
                    size="small"
                  >
                    {styleGuideOptions.map((sg) => (
                      <Select.Option key={sg.value} value={sg.value}>
                        {sg.label}
                      </Select.Option>
                    ))}
                  </Select>
                </SettingsField>

                <SettingsField>
                  <SettingsLabel>Dialect</SettingsLabel>
                  <Select
                    aria-label="Dialect"
                    value={(() => {
                      if (config.dialect) return config.dialect;
                      return dialectOptions[0]?.value ?? "";
                    })()}
                    onChange={(e) => {
                      onConfigChange({ dialect: e.target.value as Dialects });
                    }}
                    size="small"
                  >
                    {dialectOptions.map((d) => (
                      <Select.Option key={d.value} value={d.value}>
                        {d.label}
                      </Select.Option>
                    ))}
                  </Select>
                </SettingsField>

                <SettingsField>
                  <SettingsLabel>Tone</SettingsLabel>
                  <Select
                    aria-label="Tone"
                    value={config.tone || ""}
                    onChange={(e) => {
                      onConfigChange({ tone: (e.target.value || null) as Tones | null });
                    }}
                    size="small"
                  >
                    {toneOptions.map((t) => (
                      <Select.Option key={t.value} value={t.value}>
                        {t.label}
                      </Select.Option>
                    ))}
                  </Select>
                </SettingsField>

                <Button
                  variant="secondary"
                  size="small"
                  isFullWidth
                  onClick={() => {
                    setIsSettingsOpen(false);
                  }}
                >
                  Save settings
                </Button>
              </SettingsPopoverContent>
            </Popover.Content>
          </Popover>
        </FooterLeft>

        <FooterRight>
          <UserProfileButton onSignOut={onSignOut} hideSignInPrompt dropdownPosition="above" />
        </FooterRight>
      </SidebarFooter>
    </SidebarContainer>
  );
};
