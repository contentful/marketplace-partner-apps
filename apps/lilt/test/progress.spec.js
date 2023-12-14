import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ProgressItem, QualityFeedback } from '../src/progress';
import { WorkflowSteps } from '../src/workflow-steps';

describe('ProgressItem', () => {
  afterEach(cleanup);

  it('renders locale status', () => {
    const { getByText } = render(
      <ProgressItem locale="de-DE" status={WorkflowSteps.LOCALE_IN_PROGRESS} />
    );
    expect(getByText('de-DE')).toBeInTheDocument();
    expect(getByText(WorkflowSteps.LOCALE_IN_PROGRESS)).toBeInTheDocument();
    expect(() => {
      getByText('Approve');
    }).toThrow();
  });

  it('renders LQA buttons', () => {
    const { getByText } = render(
      <ProgressItem locale="de-DE" status={WorkflowSteps.READY_FOR_LQA} />
    );
    expect(getByText(WorkflowSteps.READY_FOR_LQA)).toBeInTheDocument();
    expect(getByText('Approve')).toBeInTheDocument();
    expect(getByText('Reject')).toBeInTheDocument();
  });
});

describe('QualityFeedback', () => {
  afterEach(cleanup);

  it('renders nothing if hidden', () => {
    const { getByText } = render(<QualityFeedback hidden={true} />);
    expect(() => {
      getByText('Submit');
    }).toThrow();
  });

  it('renders feedback form', () => {
    const { getByText } = render(<QualityFeedback />);
    expect(getByText('Submit')).toBeInTheDocument();
  });
});
