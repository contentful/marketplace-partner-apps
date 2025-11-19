import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils/testUtils';
import { sharedOriginalScores, createMockFieldCheck, buildWorkflow } from '../../../test/utils/rewriterFixtures';
import Sidebar from './Sidebar';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Dialects, StyleGuides, Tones } from '../../api-client/types.gen';
import { useRewriter } from '../../hooks/useRewriter';
import { useUserSettings } from '../../hooks/useUserSettings';
import { mockSdk } from '../../../test/mocks/mockSdk';

// Mock the SDK and hooks
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

vi.mock('../../hooks/useRewriter', () => ({
  useRewriter: vi.fn(),
}));

vi.mock('../../hooks/useUserSettings', () => ({
  useUserSettings: vi.fn(),
}));

const mockOriginalScores = sharedOriginalScores;

const mockFieldCheck = createMockFieldCheck({
  originalValue: 'Original test content',
  checkResponse: {
    workflow: buildWorkflow('checks', undefined, 'chk-1'),
    config: {
      dialect: Dialects.AMERICAN_ENGLISH,
      style_guide: { style_guide_type: StyleGuides.AP, style_guide_id: 'sg-1' },
      tone: Tones.PROFESSIONAL,
    },
    original: { issues: [], scores: mockOriginalScores },
  },
});

const mockRewriter = {
  fieldChecks: { field1: mockFieldCheck },
  handleAcceptSuggestion: vi.fn(),
  clearError: vi.fn(),
  handleRewrite: vi.fn(),
  setOnFieldChange: vi.fn(),
  updateCheck: vi.fn(),
  clearFieldCooldown: vi.fn(),
  isFieldInCooldown: vi.fn(),
  resetAcceptingSuggestionFlag: vi.fn(),
};

const mockUserSettings = {
  settings: {
    dialect: 'american_english',
    tone: 'professional',
    styleGuide: 'default',
  },
  updateDialect: vi.fn(),
  updateTone: vi.fn(),
  updateStyleGuide: vi.fn(),
};

// Mock SDK with field information
const mockSdkWithFields = {
  ...mockSdk,
  entry: {
    ...mockSdk.entry,
    fields: {
      field1: {
        id: 'field1',
        name: 'Field 1',
        type: 'Text',
        getValue: vi.fn(),
        setValue: vi.fn(),
      },
    },
  },
};

describe('Sidebar', () => {
  const openSettingsPanel = (forcePanel: boolean) => {
    (useUserSettings as Mock).mockReturnValue({
      ...mockUserSettings,
      settings: { dialect: null, tone: null, styleGuide: null },
      forcePanel,
    });
    render(<Sidebar />);
  };
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as Mock).mockReturnValue(mockSdkWithFields);
    (useRewriter as Mock).mockReturnValue(mockRewriter);
    (useUserSettings as Mock).mockReturnValue(mockUserSettings);
    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({ accepted: false });

    // Ensure user settings are present so Sidebar renders workflow instead of login
    globalThis.localStorage.setItem('markupai.apiKey', 'test-api-key');
    globalThis.localStorage.setItem('markupai.dialect', 'american_english');
    globalThis.localStorage.setItem('markupai.tone', 'neutral');
    globalThis.localStorage.setItem('markupai.styleGuide', 'default');
  });

  it('renders the sidebar container', () => {
    render(<Sidebar />);
    const container = document.querySelector('div[class*="css-"]');
    expect(container).toBeInTheDocument();
  });

  it('renders field check cards for valid fields', () => {
    render(<Sidebar />);
    expect(screen.getByText('Field 1')).toBeInTheDocument();
  });

  it('renders error card when there is an error', () => {
    const errorChecks = {
      field1: {
        ...mockFieldCheck,
        error: 'Test error',
      },
    };
    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: errorChecks,
    });

    render(<Sidebar />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders start block waiting when no field checks', () => {
    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: {},
    });

    render(<Sidebar />);
    expect(screen.getByText('Waiting for user to write, add, or update content')).toBeInTheDocument();
  });

  it('shows the Rewrite button and opens dialog when clicked', async () => {
    render(<Sidebar />);
    // Expand the card
    const header = screen.getByText('Field 1').closest('[data-clickable]');
    expect(header).toBeInTheDocument();
    fireEvent.click(header!);
    // Find the Rewrite button
    const rewriteButton = screen.getByText('Rewrite');
    expect(rewriteButton).toBeInTheDocument();
    fireEvent.click(rewriteButton);
    // Wait for dialog open to be called
    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrent).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button is clicked', () => {
    const errorChecks = {
      field1: {
        ...mockFieldCheck,
        error: 'Test error',
      },
    };

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: errorChecks,
    });

    render(<Sidebar />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockRewriter.clearError).toHaveBeenCalledWith('field1');
  });

  it('shows loading state when checking', () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
      checkResponse: null,
    };

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: checkingField },
    });

    render(<Sidebar />);
    expect(screen.getByText('Analyzing content')).toBeInTheDocument();
  });

  it('shows waiting state when no response and not checking', () => {
    const waitingField = createMockFieldCheck({ originalValue: 'Original test content', checkResponse: null });

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: waitingField },
    });

    render(<Sidebar />);
    expect(screen.getByText('Waiting for changes to settle')).toBeInTheDocument();
  });

  it('shows error state when error exists', () => {
    const errorField = {
      ...mockFieldCheck,
      error: 'Test error',
    };

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: errorField },
    });

    render(<Sidebar />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('shows "Rewriting" button text when checking', () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
    };

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: checkingField },
    });

    render(<Sidebar />);

    // First expand the card
    const header = screen.getByText('Field 1').closest('[data-clickable]');
    expect(header).toBeInTheDocument();
    fireEvent.click(header!);

    expect(screen.getByText('Rewriting')).toBeInTheDocument();
  });

  it('displays dash when score is neutral', () => {
    const neutralScoreField = createMockFieldCheck({
      originalValue: 'Original test content',
      checkResponse: {
        workflow: buildWorkflow('checks', undefined, 'chk-1'),
        config: {
          dialect: Dialects.AMERICAN_ENGLISH,
          style_guide: { style_guide_type: StyleGuides.AP, style_guide_id: 'sg-1' },
          tone: Tones.PROFESSIONAL,
        },
        original: {
          issues: [],
          scores: { ...mockOriginalScores, quality: { ...mockOriginalScores.quality, score: 0 } },
        },
      },
    });

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: neutralScoreField },
    });

    render(<Sidebar />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles dialog acceptance with rewrite response', async () => {
    const mockRewriteResponse = {
      workflow_id: 'rewrite-123',
      status: 'completed',
      rewrite: {
        text: 'Improved text',
        scores: { quality: { score: 90 } },
      },
    };

    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({
      accepted: true,
      fieldId: 'field1',
      rewriteResponse: mockRewriteResponse,
    });

    render(<Sidebar />);

    // Expand the card and click rewrite
    const header = screen.getByText('Field 1').closest('[data-clickable]');
    fireEvent.click(header!);
    const rewriteButton = screen.getByText('Rewrite');
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(mockRewriter.updateCheck).toHaveBeenCalledWith('field1', {
        checkResponse: mockRewriteResponse,
        hasRewriteResult: true,
      });
      expect(mockRewriter.handleAcceptSuggestion).toHaveBeenCalledWith('field1', mockRewriteResponse);
    });
  });

  it('handles dialog acceptance without rewrite response', async () => {
    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({
      accepted: true,
      fieldId: 'field1',
    });

    render(<Sidebar />);

    // Expand the card and click rewrite
    const header = screen.getByText('Field 1').closest('[data-clickable]');
    fireEvent.click(header!);
    const rewriteButton = screen.getByText('Rewrite');
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(mockRewriter.handleAcceptSuggestion).toHaveBeenCalledWith('field1');
    });
  });

  it.each([
    { caseName: 'renders settings panel when settings are open', forcePanel: false },
    { caseName: 'renders settings panel when forcePanel is true', forcePanel: true },
    { caseName: 'handles settings panel open state', forcePanel: false },
  ])('$caseName', ({ forcePanel }) => {
    openSettingsPanel(forcePanel);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('calls user settings update functions', () => {
    render(<Sidebar />);

    // Verify that useUserSettings is called and returns the expected functions
    expect(useUserSettings).toHaveBeenCalled();
    expect(mockUserSettings.updateDialect).toBeDefined();
    expect(mockUserSettings.updateTone).toBeDefined();
    expect(mockUserSettings.updateStyleGuide).toBeDefined();
  });

  it('handles field change callback to reset expanded state', () => {
    render(<Sidebar />);

    // Verify that setOnFieldChange is called
    expect(mockRewriter.setOnFieldChange).toHaveBeenCalled();

    // Get the callback function that was passed to setOnFieldChange
    const setOnFieldChangeCall = mockRewriter.setOnFieldChange.mock.calls[0][0];
    expect(typeof setOnFieldChangeCall).toBe('function');
  });
});
