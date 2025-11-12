import styled from '@emotion/styled';

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
`;

export const LeftActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
`;

const BaseButton = styled.button`
  border-radius: 6px;
  padding: 8px 24px;
  font-size: 14px;
  box-shadow: 0px 1px 0px rgba(17, 27, 43, 0.05);
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease-in-out;

  &:hover {
    opacity: 0.9;
  }
`;

export const RejectButton = styled(BaseButton)`
  background: #fff;
  color: #111b2b;
  border-color: #cfd9e0;
  font-weight: 400;
`;

export const AcceptButton = styled(BaseButton)`
  background: #008539;
  color: #fff;
  border-color: #008539;
  font-weight: 500;

  &:disabled {
    background: rgba(0, 133, 57, 0.55);
    color: #fff;
    cursor: not-allowed;
    font-weight: 500;
    border-color: rgba(0, 133, 57, 0.55);
  }
`;

export const RewriteAgainButton = styled(BaseButton)`
  background: #fff;
  color: #111b2b;
  border-color: #cfd9e0;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CopyWorkflowIdButton = styled(BaseButton)`
  background: #fff;
  color: #111b2b;
  border-color: #cfd9e0;
  font-weight: 400;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 160ms ease-in-out;
`;
