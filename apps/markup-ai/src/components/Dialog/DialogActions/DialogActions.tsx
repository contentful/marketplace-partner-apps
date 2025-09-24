import React, { useState } from 'react';
import { CopySimpleIcon, RepeatIcon, CheckCircleIcon } from '@contentful/f36-icons';
import {
  ActionsContainer,
  RejectButton,
  AcceptButton,
  RewriteAgainButton,
  CopyWorkflowIdButton,
  LeftActionsGroup,
} from './DialogActions.styles';

interface DialogActionsProps {
  onReject: () => void;
  onAccept: () => void;
  onRewriteAgain?: () => void;
  disabled?: boolean;
  showRewriteAgain?: boolean;
  workflowId?: string;
}

export const DialogActions: React.FC<DialogActionsProps> = ({
  onReject,
  onAccept,
  onRewriteAgain,
  disabled,
  showRewriteAgain = false,
  workflowId,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyWorkflowId = async () => {
    if (!workflowId) return;
    try {
      await navigator.clipboard.writeText(workflowId);
    } catch {
      // no-op fallback; clipboard might be unavailable in some contexts
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <ActionsContainer data-testid="actions-container">
      <LeftActionsGroup>
        {showRewriteAgain && onRewriteAgain && (
          <RewriteAgainButton onClick={onRewriteAgain} data-testid="rewrite-again-button">
            <RepeatIcon size="small" />
            Retry
          </RewriteAgainButton>
        )}
        {workflowId && (
          <CopyWorkflowIdButton
            onClick={handleCopyWorkflowId}
            aria-label="Copy workflow id"
            title="Copy workflow id"
            data-testid="copy-workflow-id-button"
          >
            {copied ? <CheckCircleIcon size="small" /> : <CopySimpleIcon size="small" />}
            Workflow ID
          </CopyWorkflowIdButton>
        )}
      </LeftActionsGroup>
      <RejectButton onClick={onReject} data-testid="reject-button">
        Reject & Close
      </RejectButton>
      <AcceptButton onClick={onAccept} data-testid="accept-button" disabled={disabled}>
        Accept & Insert
      </AcceptButton>
    </ActionsContainer>
  );
};
