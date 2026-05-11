/**
 * Shared chrome for full-panel sidebar views (AgentSettingsPanel,
 * AboutView's panel variant, etc.). Renders a bordered card with a
 * header row containing a back IconButton + title and a scrollable
 * body slot. Pulled out so the chrome stays in lockstep across all
 * full-panel sidepanel screens.
 */

import React from "react";
import { IconButton } from "@contentful/f36-components";
import { CaretLeftIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

export interface SidebarPanelShellProps {
  /** Title rendered next to the back button. */
  title: string;
  /** Called when the user clicks the back IconButton. */
  onBack: () => void;
  /** Optional aria-label override for the back button. Defaults to `Back`. */
  backLabel?: string;
  /** Body content. Rendered inside a scrollable area. */
  children: React.ReactNode;
}

const Container = styled.div`
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

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  padding: ${tokens.spacingS} ${tokens.spacingM};
  border-bottom: 1px solid ${tokens.gray200};
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  font-size: ${tokens.fontSizeL};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray800};
`;

const ScrollArea = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: ${tokens.spacingM};
`;

export const SidebarPanelShell: React.FC<SidebarPanelShellProps> = ({
  title,
  onBack,
  backLabel = "Back",
  children,
}) => {
  return (
    <Container>
      <HeaderBar>
        <IconButton
          aria-label={backLabel}
          icon={<CaretLeftIcon />}
          variant="transparent"
          size="small"
          onClick={onBack}
        />
        <HeaderTitle>{title}</HeaderTitle>
      </HeaderBar>
      <ScrollArea>{children}</ScrollArea>
    </Container>
  );
};

export default SidebarPanelShell;
