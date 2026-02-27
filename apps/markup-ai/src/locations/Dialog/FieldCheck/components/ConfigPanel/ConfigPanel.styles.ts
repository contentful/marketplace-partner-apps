/**
 * Styles for ConfigPanel component
 */

import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

export const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingM};

  @media (max-width: 600px) {
    padding: ${tokens.spacingS};
    gap: ${tokens.spacingS};
  }
`;

export const ConfigHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  padding-bottom: ${tokens.spacingS};
  border-bottom: 1px solid ${tokens.gray300};
`;

export const ConfigTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.fontSizeM};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray900};
`;

export const ConfigFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingM};
  padding-top: ${tokens.spacingM};
`;

export const ConfigField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

export const ConfigLabel = styled.label`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};

  .required {
    color: ${tokens.red600};
  }
`;
