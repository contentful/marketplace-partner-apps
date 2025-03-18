import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Sidebar from './Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../hooks/useWorkflows', () => ({
  default: (apiKey: string) => ({
    isAuthenticated: apiKey === '12345',
    isLoading: false,
    runWorkflow: vi.fn().mockImplementation((workflowId) => {
      return workflowId === 'workflow-1' ? Promise.resolve('job-123') : Promise.resolve(null);
    })
  })
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with workflow options', () => {
    const { container } = render(<Sidebar />);
    
    expect(container.innerHTML).toBeTruthy();
    
    const options = container.querySelectorAll('option');
    let hasWorkflow1 = false;
    options.forEach(option => {
      if (option.getAttribute('value') === 'workflow-1') {
        hasWorkflow1 = true;
      }
    });
    
    expect(hasWorkflow1).toBe(true);
    
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });
});
