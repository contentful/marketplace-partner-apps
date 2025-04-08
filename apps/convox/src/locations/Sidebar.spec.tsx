import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Sidebar from './Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const runWorkflowMock = vi.fn();
vi.mock('../hooks/useWorkflows', () => ({
  default: (apiKey: string) => ({
    isAuthenticated: apiKey === '12345',
    isLoading: false,
    runWorkflow: runWorkflowMock
  })
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // setting up mock implementation for runWorkflow
    runWorkflowMock.mockImplementation((workflowId) => {
      return workflowId === 'workflow-1' ? Promise.resolve('job-123') : Promise.resolve(null);
    });

    // setting up mock sdk with installation parameters
    mockSdk.parameters.installation = {
      convoxDeployKey: '12345',
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'First Workflow' },
          displayName: 'First Workflow'
        },
        {
          workflow: { id: 'workflow-2', name: 'Second Workflow' },
          displayName: 'Second Workflow'
        }
      ]
    };

    mockSdk.entry = {
      getSys: vi.fn().mockReturnValue({ publishedVersion: 1 }),
      onSysChanged: vi.fn().mockImplementation((callback) => {
        mockSdk.entry.sysChangeCallback = callback;
        return vi.fn();
      }),
      sysChangeCallback: null
    };

    mockSdk.notifier = {
      success: vi.fn(),
      error: vi.fn()
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with workflow options', () => {
    const { container } = render(<Sidebar />);

    expect(container.innerHTML).toBeTruthy();

    const options = container.querySelectorAll('option');
    expect(options.length).toBe(2);

    let hasWorkflow1 = false;
    let hasWorkflow2 = false;

    options.forEach(option => {
      if (option.getAttribute('value') === 'workflow-1') hasWorkflow1 = true;
      if (option.getAttribute('value') === 'workflow-2') hasWorkflow2 = true;
    });

    expect(hasWorkflow1).toBe(true);
    expect(hasWorkflow2).toBe(true);

    const button = container.querySelector('button')!;
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Run Workflow');
  });

  it('disable the controls when entry is a draft', () => {
    mockSdk.entry.getSys.mockReturnValue({ publishedVersion: undefined });

    const { container } = render(<Sidebar />);

    const select = container.querySelector('select')!;
    const button = container.querySelector('button')!;

    expect(select.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    const draftMessages = Array.from(container.querySelectorAll('p')).filter(
      p => p.textContent === 'You must publish your draft before you can run the Convox Workflow.'
    );
    expect(draftMessages.length).toBe(1);
  });

  it('enable the controls when entry is published', () => {

    mockSdk.entry.getSys.mockReturnValue({ publishedVersion: 1 });
    const { container } = render(<Sidebar />);

    const select = container.querySelector('select')!;
    const button = container.querySelector('button')!;

    expect(select.disabled).toBe(false);
    expect(button.disabled).toBe(false);

    const draftMessages = Array.from(container.querySelectorAll('p')).filter(
      p => p.textContent === 'You must publish your draft before you can run the Convox Workflow.'
    );
    expect(draftMessages.length).toBe(0);
  });

  it('disable the controls when not authenticated', () => {
    mockSdk.parameters.installation.convoxDeployKey = 'invalid-key';

    const { container } = render(<Sidebar />);

    const select = container.querySelector('select')!;
    const button = container.querySelector('button')!;

    expect(select.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    const authErrors = Array.from(container.querySelectorAll('p')).filter(
      p => p.textContent === 'Your Convox deploy key is expired/removed.'
    );
    expect(authErrors.length).toBe(1);
  });

  it('changes selected workflow when dropdown value changes', () => {
    const { container } = render(<Sidebar />);

    const select = container.querySelector('select')!;

    expect(select.value).toBe('workflow-1');

    fireEvent.change(select, { target: { value: 'workflow-2' } });

    expect(select.value).toBe('workflow-2');
  });

  it('runs workflow successfully and shows success notification', async () => {
    const { container } = render(<Sidebar />);

    const button = container.querySelector('button')!;

    fireEvent.click(button);

    await waitFor(() => {
      expect(runWorkflowMock).toHaveBeenCalledWith('workflow-1');

      expect(mockSdk.notifier.success).toHaveBeenCalledWith(
        'Workflow First Workflow started running.'
      );
    });
  });

  it('show error notification when workflow run fails', async () => {
    runWorkflowMock.mockResolvedValue(null);

    const { container } = render(<Sidebar />);

    const select = container.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'workflow-2' } });

    const button = container.querySelector('button')!;
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSdk.notifier.error).toHaveBeenCalledWith(
        'Workflow Second Workflow failed to run.'
      );
    });
  });

  it('does not run workflow when in draft state', () => {
    mockSdk.entry.getSys.mockReturnValue({ publishedVersion: undefined });

    const { container } = render(<Sidebar />);

    const button = container.querySelector('button')!;

    fireEvent.click(button);

    expect(runWorkflowMock).not.toHaveBeenCalled();
  });
});
