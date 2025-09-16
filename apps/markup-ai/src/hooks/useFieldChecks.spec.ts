import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldChecks } from './useFieldChecks';

describe('useFieldChecks', () => {
  it('creates, updates, removes and clears checks', () => {
    const { result } = renderHook(() => useFieldChecks());

    act(() => result.current.createCheck('f1', 'text'));
    expect(Object.keys(result.current.fieldChecks)).toContain('f1');

    act(() => result.current.updateCheck('f1', { isChecking: true }));
    expect(result.current.fieldChecks.f1.isChecking).toBe(true);

    act(() => result.current.removeCheck('f1'));
    expect(result.current.fieldChecks['f1']).toBeUndefined();

    act(() => {
      result.current.createCheck('f1', 'text');
      result.current.createCheck('f2', 'text');
      result.current.clearChecks();
    });
    expect(Object.keys(result.current.fieldChecks)).toHaveLength(0);
  });
});
