import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ConvoxConfigEditor from './ConvoxConfigEditor';
import { mockWorkflows } from '../../test/mocks';
import { mockWorkflowConfigs } from '../../test/mocks';

describe('ConvoxConfigEditor', () => {

    const mockUpdateWorkflowConfigs = vi.fn();
    const mockRemoveWorkflowConfigs = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the component with workflow configs', () => {
        render(
            <ConvoxConfigEditor
                workflowConfigs={mockWorkflowConfigs}
                isAuthenticated={true}
                workflows={mockWorkflows}
                updateWorkflowConfigs={mockUpdateWorkflowConfigs}
                removeWorkflowConfigs={mockRemoveWorkflowConfigs}
            />
        );

        const heading = screen.getByText('Configure Convox Workflows');
        expect(heading).toBeTruthy();

        const addButton = screen.getByText('Add workflows');
        expect(addButton).toBeTruthy();

        const displayName1 = screen.getByText('Cup Cake');
        expect(displayName1).toBeTruthy();

        const displayName2 = screen.getByText('Blue Berry');
        expect(displayName2).toBeTruthy();

        const workflowName1 = screen.getByText('cup cake workflow');
        expect(workflowName1).toBeTruthy();

        const workflowName2 = screen.getByText('blueberry workflow');
        expect(workflowName2).toBeTruthy();
    });

    it('disables buttons when not authenticated', () => {
        render(
            <ConvoxConfigEditor
                workflowConfigs={mockWorkflowConfigs}
                isAuthenticated={false}
                workflows={mockWorkflows}
                updateWorkflowConfigs={mockUpdateWorkflowConfigs}
                removeWorkflowConfigs={mockRemoveWorkflowConfigs}
            />
        );

        const addButton = screen.getByRole('button', { name: /add workflows/i });
        expect(addButton.hasAttribute('disabled')).toBe(true);

    });

    it('calls removeWorkflowConfigs when remove link is clicked', () => {
        render(
            <ConvoxConfigEditor
                workflowConfigs={mockWorkflowConfigs}
                isAuthenticated={true}
                workflows={mockWorkflows}
                updateWorkflowConfigs={mockUpdateWorkflowConfigs}
                removeWorkflowConfigs={mockRemoveWorkflowConfigs}
            />
        );

        const removeLinks = screen.getAllByText('Remove');
        fireEvent.click(removeLinks[0]);

        expect(mockRemoveWorkflowConfigs).toHaveBeenCalledWith('12345');
    });
});
