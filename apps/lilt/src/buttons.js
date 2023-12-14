import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/f36-components';
import { FaceHappyIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

import { WorkflowSteps } from './workflow-steps';

export const ManageEntriesButton = ({ onClick, isVisible = false }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Button style={{ margin: `${tokens.spacingXs} 0` }} isFullWidth onClick={onClick}>
      Manage Other Entries
    </Button>
  );
};

ManageEntriesButton.propTypes = {
  isVisible: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export const LiltCreateButton = ({ onClick, isVisible = false, hasLiltCreateAccess }) => {
  if (!isVisible) {
    return null;
  }

  if (!hasLiltCreateAccess) {
    return (
      <Button
        startIcon={<FaceHappyIcon />}
        style={{
          margin: `${tokens.spacingXs} 0`
        }}
        isFullWidth
        buttonType="secondary"
        onClick={() => window.open('https://getstarted.lilt.com/contact-sales-lp/', '_blank')}>
        Contact Sales to enable Lilt Create
      </Button>
    );
  }

  return (
    <Button style={{ margin: `${tokens.spacingXs} 0` }} isFullWidth onClick={onClick}>
      Generate content using Contextual AI
    </Button>
  );
};

LiltCreateButton.propTypes = {
  isVisible: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  hasLiltCreateAccess: PropTypes.bool
};

export class SendButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { isDisabled, onClick } = this.props;

    return (
      <section className="send-button">
        <Button isFullWidth={true} isDisabled={isDisabled} variant="positive" onClick={onClick}>
          Send for Localization
        </Button>
      </section>
    );
  }
}

SendButton.propTypes = {
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func
};

function CompleteButton(props) {
  const { isDisabled, onClick } = props;

  return (
    <Button isFullWidth={true} isDisabled={isDisabled} variant="positive" onClick={onClick}>
      Complete Localization Job
    </Button>
  );
}

CompleteButton.propTypes = {
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func
};

function CancelButton(props) {
  const { isDisabled, onClick } = props;

  return (
    <Button isFullWidth={true} isDisabled={isDisabled} variant="negative" onClick={onClick}>
      Cancel Localization Request
    </Button>
  );
}

CancelButton.propTypes = {
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func
};

export function LocalizeButton(props) {
  const { status, userCanPublish } = props;
  const { startJob, cancelJob, completeJob } = props;

  if (!status || status === WorkflowSteps.NEEDS_LOCALIZATION) {
    return <SendButton isDisabled={!userCanPublish} onClick={startJob} />;
  }

  if (status === WorkflowSteps.READY_TO_START) {
    return <CancelButton isDisabled={!userCanPublish} onClick={cancelJob} />;
  }

  if (status === WorkflowSteps.READY_TO_PUBLISH) {
    return <CompleteButton isDisabled={!userCanPublish} onClick={completeJob} />;
  }

  return <CompleteButton isDisabled={true} onClick={completeJob} />;
}

LocalizeButton.propTypes = {
  status: PropTypes.string,
  startJob: PropTypes.func,
  cancelJob: PropTypes.func,
  completeJob: PropTypes.func,
  userCanPublish: PropTypes.bool
};
