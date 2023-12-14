import React from 'react';
import PropTypes from 'prop-types';
import { Form, Textarea } from '@contentful/forma-36-react-components';
import { Button } from '@contentful/f36-components';

import { InfoBlock } from './spacing';
import { WorkflowSteps } from './workflow-steps';

export function QualityFeedback(props) {
  const { hidden } = props;
  const { handleFeedbackSubmit } = props;

  if (hidden) {
    return null;
  }

  return (
    <Form className="progress-feedback f36-padding-top--xs" onSubmit={handleFeedbackSubmit}>
      <Textarea name="feedback" />
      <Button size="small" variant="positive" type="submit">
        Submit
      </Button>
    </Form>
  );
}

QualityFeedback.propTypes = {
  hidden: PropTypes.bool,
  handleFeedbackSubmit: PropTypes.func
};

export class QualityAcceptance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      feedbackHidden: true
    };

    this.toggleFeedback = this.toggleFeedback.bind(this);
    this.handleFeedbackSubmit = this.handleFeedbackSubmit.bind(this);
  }

  toggleFeedback() {
    const { feedbackHidden } = this.state;
    this.setState({ feedbackHidden: !feedbackHidden });
  }

  handleFeedbackSubmit(e) {
    const { locale, rejectLocale } = this.props;
    const feedbackForm = e.currentTarget;
    const feedbackValue = feedbackForm.feedback.value;
    if (!feedbackValue) {
      return;
    }
    this.setState({ feedbackHidden: true }, () => {
      rejectLocale(locale, feedbackValue);
    });
  }

  render() {
    const { status, locale, userCanUpdate } = this.props;
    const { approveLocale } = this.props;
    const { feedbackHidden } = this.state;

    if (status !== WorkflowSteps.READY_FOR_LQA) {
      return null;
    }

    let buttonText = 'Reject';
    if (!feedbackHidden) {
      buttonText = 'Close';
    }

    const isDisabled = !userCanUpdate;

    return (
      <>
        <button
          className="progress-lqa"
          disabled={isDisabled}
          onClick={() => approveLocale(locale)}>
          Approve
        </button>
        <button className="progress-lqa" disabled={isDisabled} onClick={this.toggleFeedback}>
          {buttonText}
        </button>
        <QualityFeedback
          hidden={feedbackHidden}
          handleFeedbackClose={this.handleFeedbackClose}
          handleFeedbackSubmit={this.handleFeedbackSubmit}
        />
      </>
    );
  }
}

QualityAcceptance.propTypes = {
  locale: PropTypes.string,
  status: PropTypes.string,
  userCanUpdate: PropTypes.bool,
  approveLocale: PropTypes.func,
  rejectLocale: PropTypes.func
};

export function ProgressItem(props) {
  const { locale, status, userCanUpdate } = props;
  const { approveLocale, rejectLocale } = props;

  return (
    <InfoBlock className="progress-item">
      <span className="progress-locale">{locale}</span>
      <span className="progress-status">{status}</span>
      <QualityAcceptance
        status={status}
        locale={locale}
        userCanUpdate={userCanUpdate}
        approveLocale={approveLocale}
        rejectLocale={rejectLocale}
      />
    </InfoBlock>
  );
}

ProgressItem.propTypes = {
  locale: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  userCanUpdate: PropTypes.bool,
  approveLocale: PropTypes.func,
  rejectLocale: PropTypes.func
};

export function LiltProgress(props) {
  const { status, progress, availableLocales, defaultLocale } = props;
  const { userCanUpdate, updateStatus, approveLocale, rejectLocale } = props;

  const progressDisabledSteps = [WorkflowSteps.NEEDS_LOCALIZATION, WorkflowSteps.COMPLETE];
  const progressDisabled = !status || progressDisabledSteps.includes(status);

  if (progressDisabled) {
    return null;
  }

  const localeProgress = {};
  for (const locale of availableLocales) {
    if (locale === defaultLocale) {
      continue;
    }
    if (status === WorkflowSteps.READY_TO_START) {
      localeProgress[locale] = status;
    }
  }

  for (const locale in progress) {
    localeProgress[locale] = progress[locale];
  }

  const locales = Object.keys(localeProgress);
  const localeStates = Object.values(localeProgress);

  const isDone = localeStates.every(state => {
    return state === WorkflowSteps.LOCALE_DONE;
  });

  if (isDone && status !== WorkflowSteps.READY_TO_PUBLISH) {
    updateStatus(WorkflowSteps.READY_TO_PUBLISH);
  }

  const isInProgress = localeStates.every(state => {
    const isInLQA = state === WorkflowSteps.LOCALE_IN_LQA;
    const isInProgress = state === WorkflowSteps.LOCALE_IN_PROGRESS;
    const isDone = state === WorkflowSteps.LOCALE_DONE;
    return !isInLQA && (isDone || isInProgress);
  });

  if (isInProgress && status === WorkflowSteps.READY_FOR_LQA) {
    updateStatus(WorkflowSteps.IN_PROGRESS);
  }

  const progressItems = locales.map(locale => {
    const status = localeProgress[locale];
    return (
      <ProgressItem
        key={locale}
        locale={locale}
        status={status}
        userCanUpdate={userCanUpdate}
        approveLocale={approveLocale}
        rejectLocale={rejectLocale}
      />
    );
  });

  return <section className="f36-padding-top--xs">{progressItems}</section>;
}

LiltProgress.propTypes = {
  status: PropTypes.string,
  availableLocales: PropTypes.array,
  defaultLocale: PropTypes.string,
  progress: PropTypes.object,
  userCanUpdate: PropTypes.bool,
  updateStatus: PropTypes.func,
  approveLocale: PropTypes.func,
  rejectLocale: PropTypes.func
};
