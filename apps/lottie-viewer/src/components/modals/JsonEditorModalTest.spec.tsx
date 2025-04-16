import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JsonEditorModal from './JsonEditorModal';

describe('JsonEditorModal', () => {
  const baseProps = {
    showJsonModal: true,
    onShowJsonModalChange: vi.fn(),
    onSave: vi.fn(),
    onEditorWillMount: vi.fn(),
    updateUndoRedoState: vi.fn(),
    lottieJson: { foo: 'bar' },
  };

  it('renders modal with editor and buttons', () => {
    render(<JsonEditorModal {...baseProps} />);
    expect(screen.getByText(/Lottie Preview - JSON editor/i)).toBeTruthy();
    expect(screen.getByText(/Undo/i)).toBeTruthy();
    expect(screen.getByText(/Redo/i)).toBeTruthy();
    expect(screen.getByText(/Save/i)).toBeTruthy();
  });

  it('calls onSave with stringified JSON when Save is clicked', () => {
    render(<JsonEditorModal {...baseProps} />);
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    expect(baseProps.onSave).toHaveBeenCalledWith(JSON.stringify(baseProps.lottieJson, null, 2));
  });
});
