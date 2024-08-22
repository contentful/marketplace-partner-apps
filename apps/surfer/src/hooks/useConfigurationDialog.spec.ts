import { act, renderHook } from '@testing-library/react';
import { mockSdk } from '../../test/mocks';
import { useConfigurationDialog } from './useConfigurationDialog';

let mockOpenCurrenAppCallback = vi.fn();

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ...mockSdk,
    dialogs: {
      openCurrentApp: mockOpenCurrenAppCallback,
    },
  }),
}));

describe('useConfigurationDialog', () => {
  const requestView = vi.fn();
  const refreshDraft = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockOpenCurrenAppCallback.mockImplementation(() => Promise.resolve());
  });

  it('should open the configuration dialog', async () => {
    const { result } = renderHook(() => useConfigurationDialog('test-share-token'));

    expect(result.current.isConfigurationOpen).toBe(false);

    act(() => {
      result.current.openConfigurationDialog({ requestView, refreshDraft } as any);
    });

    expect(result.current.isConfigurationOpen).toBe(true);
    expect(mockOpenCurrenAppCallback.mock.calls[0][0]).toStrictEqual({
      position: 'center',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      width: 'fullWidth',
      minHeight: '85vh',
      parameters: {
        shareToken: 'test-share-token',
      },
    });
  });

  it('refresh the view when the dialog closes it closes', async () => {
    const { result } = renderHook(() => useConfigurationDialog('test-share-token'));

    await act(async () => {
      result.current.openConfigurationDialog({ requestView, refreshDraft } as any);
    });

    expect(refreshDraft).toHaveBeenCalled();
    expect(requestView).toHaveBeenCalledWith('guidelines');
  });
});
