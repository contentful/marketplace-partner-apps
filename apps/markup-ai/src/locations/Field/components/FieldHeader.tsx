import React from "react";
import { Button, Tooltip } from "@contentful/f36-components";
import styled from "@emotion/styled";
import { DisabledTooltipTarget } from "../../../components/DisabledTooltipTarget/DisabledTooltipTarget";

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.8;
`;

const LogoImage = styled.img`
  height: 18px;
  width: auto;
  display: block;
`;

export interface FieldHeaderProps {
  onCheckClick: () => void;
  isDisabled?: boolean;
  /**
   * Tooltip copy shown over the Check button when it is disabled for a
   * domain reason (e.g. style agent disabled at the org level). Plain
   * `isDisabled=true` without a reason just dims the button silently.
   */
  checkDisabledReason?: string | null;
}

export const FieldHeader: React.FC<FieldHeaderProps> = ({
  onCheckClick,
  isDisabled = false,
  checkDisabledReason = null,
}) => {
  const checkButton = (
    <Button variant="secondary" size="small" onClick={onCheckClick} isDisabled={isDisabled}>
      <ButtonContent>
        <LogoImage src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
        Markup AI
      </ButtonContent>
    </Button>
  );

  if (checkDisabledReason) {
    return (
      <Tooltip content={checkDisabledReason} placement="bottom">
        <DisabledTooltipTarget role="button">{checkButton}</DisabledTooltipTarget>
      </Tooltip>
    );
  }

  return checkButton;
};
