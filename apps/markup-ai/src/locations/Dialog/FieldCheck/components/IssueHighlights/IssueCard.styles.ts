/**
 * Styles for IssueCard component
 */

import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

export const CardContainer = styled.div`
  width: 288px;
  background: ${tokens.colorWhite};
  border-radius: ${tokens.borderRadiusMedium};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: ${tokens.spacingM};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray900};
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${tokens.spacingS};
`;

export const CategoryTitle = styled.div`
  font-weight: ${tokens.fontWeightDemiBold};
  text-transform: capitalize;
  color: ${tokens.gray900};
`;

export const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: ${tokens.borderRadiusSmall};
  cursor: pointer;
  color: ${tokens.gray700};
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: ${tokens.gray200};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const NavCounter = styled.span`
  min-width: 40px;
  text-align: center;
  font-weight: ${tokens.fontWeightMedium};
`;

export const ContextSentence = styled.div`
  margin-bottom: ${tokens.spacingM};
  color: ${tokens.gray900};
  line-height: 1.5;
`;

export const SuggestionBox = styled.div`
  position: relative;
  background: #f7f3ed;
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusSmall};
  padding: ${tokens.spacingS} ${tokens.spacingM};
  margin-bottom: ${tokens.spacingM};
`;

export const SuggestionLabel = styled.div`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
  margin-bottom: ${tokens.spacingXs};
`;

export const SuggestionText = styled.div`
  padding-right: 60px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: ${tokens.gray700};
`;

export const ApplyButton = styled.button`
  position: absolute;
  right: 8px;
  top: 8px;
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  background-color: ${tokens.red600};
  color: ${tokens.colorWhite};
  border: none;
  border-radius: 24px;
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${tokens.red700};
  }

  &:focus {
    outline: 2px solid ${tokens.red600};
    outline-offset: 1px;
  }
`;

export const FeedbackControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${tokens.spacingXs};
`;

export const FeedbackButton = styled.button<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background-color: ${(props) => (props.isActive ? tokens.gray300 : "transparent")};
  color: ${tokens.gray600};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${tokens.gray200};
  }
`;

export const FeedbackPanel = styled.div`
  margin-top: ${tokens.spacingS};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingS};
`;

export const FeedbackTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: ${tokens.spacingS};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusSmall};
  font-size: ${tokens.fontSizeS};
  font-family: ${tokens.fontStackPrimary};
  resize: vertical;

  &:focus {
    outline: 2px solid ${tokens.blue600};
    border-color: ${tokens.blue600};
  }

  &::placeholder {
    color: ${tokens.gray500};
  }
`;

export const FeedbackActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;
