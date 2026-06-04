/**
 * Popover anchored on the severity progress bar that breaks down totals:
 * per-severity active counts plus applied / dismissed.
 */

import React from "react";
import { Popover } from "@contentful/f36-components";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  APPLIED_BAR_COLOR,
  DISMISSED_BAR_COLOR,
  SEVERITY_BAR_COLORS,
} from "../../../../../utils/scoreColors";
import type { CortexSeverity } from "../../../../../agents/types";

const SEVERITY_OPTIONS: CortexSeverity[] = ["high", "medium", "low"];
const SEVERITY_LABELS: Record<CortexSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export interface AuditTrailPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement;
  severityCounts: Record<CortexSeverity, number>;
  appliedCount: number;
  dismissedCount: number;
}

const Content = styled.div`
  padding: ${tokens.spacingS};
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const Title = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${tokens.spacing2Xs};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingS};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
`;

const Swatch = styled.span<{ color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${(p) => p.color};
  margin-right: ${tokens.spacingXs};
`;

const RowLeft = styled.span`
  display: flex;
  align-items: center;
`;

const RowCount = styled.span`
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
`;

const Divider = styled.div`
  height: 1px;
  background: ${tokens.gray200};
  margin: ${tokens.spacing2Xs} 0;
`;

export const AuditTrailPopover: React.FC<AuditTrailPopoverProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  severityCounts,
  appliedCount,
  dismissedCount,
}) => {
  return (
    <Popover
      isOpen={isOpen}
      onClose={() => {
        onOpenChange(false);
      }}
    >
      <Popover.Trigger>{trigger}</Popover.Trigger>
      <Popover.Content>
        <Content>
          <Title>Issue breakdown</Title>
          {SEVERITY_OPTIONS.map((sev) => (
            <Row key={sev}>
              <RowLeft>
                <Swatch color={SEVERITY_BAR_COLORS[sev]} />
                {SEVERITY_LABELS[sev]}
              </RowLeft>
              <RowCount>{String(severityCounts[sev])}</RowCount>
            </Row>
          ))}
          <Divider />
          <Row>
            <RowLeft>
              <Swatch color={APPLIED_BAR_COLOR} />
              Applied
            </RowLeft>
            <RowCount>{String(appliedCount)}</RowCount>
          </Row>
          <Row>
            <RowLeft>
              <Swatch color={DISMISSED_BAR_COLOR} />
              Dismissed
            </RowLeft>
            <RowCount>{String(dismissedCount)}</RowCount>
          </Row>
        </Content>
      </Popover.Content>
    </Popover>
  );
};
