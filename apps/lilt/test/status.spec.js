import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { LiltStatus } from '../src/status';
import { WorkflowSteps } from '../src/workflow-steps';

describe('LiltStatus', () => {
  afterEach(cleanup);

  it('renders "Unpublished"', () => {
    const { getByText } = render(<LiltStatus />);
    expect(getByText(WorkflowSteps.UNPUBLISHED)).toBeInTheDocument();
  });

  it('renders "Needs Localization"', () => {
    const status = WorkflowSteps.NEEDS_LOCALIZATION;
    const { getByText } = render(<LiltStatus status={status} isPublished={true} />);
    expect(getByText(status)).toBeInTheDocument();
  });

  it('renders "Complete"', () => {
    const status = WorkflowSteps.COMPLETE;
    const { getByText } = render(<LiltStatus status={status} isPublished={true} />);
    expect(getByText(status)).toBeInTheDocument();
  });

  it('renders "In Progress"', () => {
    const status = WorkflowSteps.IN_PROGRESS;
    const { getByText } = render(<LiltStatus status={status} isPublished={true} />);
    expect(getByText(status)).toBeInTheDocument();
  });
});
