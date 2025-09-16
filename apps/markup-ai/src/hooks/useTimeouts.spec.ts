import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeouts } from './useTimeouts';

describe('useTimeouts', () => {
  it('sets, clears, and clears all timeouts', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTimeouts());
    const callback = vi.fn();

    act(() => result.current.setTimeout('a', callback, 1000));
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    const cb2 = vi.fn();
    act(() => result.current.setTimeout('b', cb2, 1000));
    act(() => result.current.clearTimeout('b'));
    vi.advanceTimersByTime(2000);
    expect(cb2).not.toHaveBeenCalled();

    const cb3 = vi.fn();
    act(() => {
      result.current.setTimeout('c', cb3, 1000);
      result.current.clearAllTimeouts();
    });
    vi.advanceTimersByTime(2000);
    expect(cb3).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
