import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils/testUtils';
import Sidebar from './Sidebar';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useRewriter } from '../../hooks/useRewriter';
import { mockSdk } from '../../../test/mocks/mockSdk';

// Mock the SDK and hooks
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

vi.mock('../../hooks/useRewriter', () => ({
  useRewriter: vi.fn(),
}));

const mockOriginalScores = {
  quality: {
    score: 72,
    grammar: { score: 90, issues: 1 },
    consistency: { score: 80, issues: 2 },
    terminology: { score: 100, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 64,
      flesch_reading_ease: 51.4,
      sentence_complexity: 38.9,
      vocabulary_complexity: 45.6,
      sentence_count: 6,
      word_count: 112,
      average_sentence_length: 18.7,
    },
    tone: {
      score: 78,
      informality: 38.2,
      liveliness: 33.9,
      informality_alignment: 115.8,
      liveliness_alignment: 106.4,
    },
  },
};

const mockFieldCheck = {
  fieldId: 'field1',
  originalValue: 'Original test content',
  isChecking: false,
  checkResponse: {
    workflow: {
      id: 'chk-1',
      type: 'checks',
      api_version: '1.0.0',
      generated_at: '2025-01-15T14:22:33Z',
      status: 'completed',
      webhook_response: { url: 'https://api.example.com/webhook', status_code: 200 },
    },
    config: {
      dialect: 'american_english',
      style_guide: { style_guide_type: 'ap', style_guide_id: 'sg-1' },
      tone: 'neutral',
    },
    original: {
      issues: [],
      scores: mockOriginalScores,
    },
  },
  rewriteResponse: null,
  error: null,
  lastUpdated: Date.now(),
  hasRewriteResult: false,
};

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
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as Mock).mockReturnValue(mockSdkWithFields);
    (useRewriter as Mock).mockReturnValue(mockRewriter);
    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({ accepted: false });

    // Ensure user settings are present so Sidebar renders workflow instead of login
    window.localStorage.setItem('markupai.apiKey', 'test-api-key');
    window.localStorage.setItem('markupai.dialect', 'american_english');
    window.localStorage.setItem('markupai.tone', 'neutral');
    window.localStorage.setItem('markupai.styleGuide', 'default');
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
    const waitingField = {
      ...mockFieldCheck,
      isChecking: false,
      checkResponse: null,
    };

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
    const neutralScoreField = {
      ...mockFieldCheck,
      checkResponse: {
        ...mockFieldCheck.checkResponse,
        original: {
          ...mockFieldCheck.checkResponse.original,
          scores: {
            ...mockOriginalScores,
            quality: { ...mockOriginalScores.quality, score: 0 },
          },
        },
      },
    };

    (useRewriter as Mock).mockReturnValue({
      ...mockRewriter,
      fieldChecks: { field1: neutralScoreField },
    });

    render(<Sidebar />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
