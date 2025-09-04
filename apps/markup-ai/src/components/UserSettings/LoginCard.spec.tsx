import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/testUtils';
import LoginCard from './LoginCard';

describe('LoginCard', () => {
  it('renders heading and input with save disabled when empty', () => {
    const onSave = vi.fn();
    render(<LoginCard initialApiKey="" onSave={onSave} />);

    expect(screen.getByText('Markup AI Login')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter your API key');
    expect(input).toBeInTheDocument();
    const saveBtn = screen.getByRole('button', { name: 'Save & Continue' });
    expect(saveBtn).toBeDisabled();
  });

  it('enables save when input has value and calls onSave', () => {
    const onSave = vi.fn();
    render(<LoginCard onSave={onSave} />);

    const input = screen.getByPlaceholderText('Enter your API key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test-key' } });
    const saveBtn = screen.getByRole('button', { name: 'Save & Continue' });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledWith('test-key');
  });

  it('shows error note when error prop is provided', () => {
    const onSave = vi.fn();
    render(<LoginCard onSave={onSave} error="Invalid key" />);
    expect(screen.getByText('Invalid key')).toBeInTheDocument();
  });

  it('shows Clear Key button and calls onClear', () => {
    const onSave = vi.fn();
    const onClear = vi.fn();
    render(<LoginCard onSave={onSave} onClear={onClear} />);
    const clearBtn = screen.getByRole('button', { name: 'Clear Key' });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});
