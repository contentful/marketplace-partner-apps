import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { LocalizeButton } from '../src/buttons';
import { WorkflowSteps } from '../src/workflow-steps';

describe('LocalizeButton', () => {
  afterEach(cleanup);

  it('renders "Send for Localization"', () => {
    const { getByText } = render(<LocalizeButton />);
    expect(getByText('Send for Localization')).toBeInTheDocument();
  });

  it('renders "Cancel Localization Request"', () => {
    const { getByText } = render(<LocalizeButton status={WorkflowSteps.READY_TO_START} />);
    expect(getByText('Cancel Localization Request')).toBeInTheDocument();
  });

  it('renders disabled "Complete" button', () => {
    const { container, getByText } = render(<LocalizeButton status={WorkflowSteps.IN_PROGRESS} />);
    const button = container.querySelector('button');
    expect(getByText('Complete Localization Job')).toBeInTheDocument();
    expect(button).toHaveAttribute('disabled');
  });

  it('renders active "Complete" button', () => {
    const { container, getByText } = render(
      <LocalizeButton status={WorkflowSteps.READY_TO_PUBLISH} userCanPublish={true} />
    );
    const button = container.querySelector('button');
    expect(getByText('Complete Localization Job')).toBeInTheDocument();
    expect(button).not.toHaveAttribute('disabled');
  });
});
