import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { render, act, fireEvent, waitFor, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

vi.mock('../../src/utils/EntryCloner', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      cloneEntry: vi.fn().mockResolvedValue({
        clonedEntry: { sys: { id: 'cloned-id' } },
        referencesCount: 2,
        clonesCount: 2,
        updatesCount: 1,
      }),
    })),
  };
});

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Clone entry')).toBeDefined();
  });

  it('shows message with references count', async () => {
    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });
    expect(getByText('Found 2 references, created 2 new entries, updated 1 reference')).toBeDefined();
  });

  it('calls redirect and shows redirect message', async () => {
    const { getByText } = render(<Sidebar />);
    await act(async () => {
      fireEvent.click(getByText('Clone entry'));
    });
    expect(getByText(/Redirecting to newly created clone in/)).toBeDefined();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('cloned-id');
  });
});
