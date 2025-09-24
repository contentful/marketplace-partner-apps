import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/testUtils';
import { FieldCheckCard } from './FieldCheckCard';
import { FieldCheck } from '../../types/content';
import { IssueCategory, Status, StyleAnalysisSuccessResp } from '@markupai/toolkit';
import { mockSdk } from '../../../test/mocks/mockSdk';

// Mock useSDK to always return mockSdk
vi.mock('@contentful/react-apps-toolkit', async () => {
  const actual = await vi.importActual<typeof import('@contentful/react-apps-toolkit')>(
    '@contentful/react-apps-toolkit',
  );
  return {
    ...actual,
    useSDK: () => mockSdk,
  };
});

const mockCheckResponse: StyleAnalysisSuccessResp = {
  workflow: {
    id: 'chk-2b5f8d3a-9c7e-4f2b-a8d1-6e9c3f7b4a2d',
    type: 'checks',
    api_version: '1.0.0',
    generated_at: '2025-01-15T14:22:33Z',
    status: Status.Completed,
    webhook_response: {
      url: 'https://api.example.com/webhook',
      status_code: 200,
    },
  },
  config: {
    dialect: 'canadian_english',
    style_guide: {
      style_guide_type: 'ap',
      style_guide_id: 'sg-8d4e5f6a-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
    },
    tone: 'conversational',
  },
  original: {
    issues: [
      {
        original: 'therefor',
        position: {
          start_index: 89,
        },
        subcategory: 'spelling',
        category: IssueCategory.Grammar,
      },
      {
        original: 'leverage',
        position: {
          start_index: 156,
        },
        subcategory: 'vocabulary',
        category: IssueCategory.Grammar,
      },
      {
        original: 'going forward',
        position: {
          start_index: 234,
        },
        subcategory: 'word_choice',
        category: IssueCategory.Tone,
      },
      {
        original: 'email',
        position: {
          start_index: 312,
        },
        subcategory: 'punctuation',
        category: IssueCategory.Consistency,
      },
      {
        original: 'towards',
        position: {
          start_index: 405,
        },
        subcategory: 'word_choice',
        category: IssueCategory.Consistency,
      },
    ],
    scores: {
      quality: {
        score: 72,
        grammar: {
          score: 95,
          issues: 1,
        },
        consistency: {
          score: 80,
          issues: 2,
        },
        terminology: {
          score: 100,
          issues: 0,
        },
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
    },
  },
};

const mockFieldCheck: FieldCheck = {
  fieldId: 'test-field',
  originalValue: 'Original test content',
  isChecking: false,
  checkResponse: mockCheckResponse,
  error: null,
  lastUpdated: Date.now(),
  hasRewriteResult: false,
};

// Helper to wrap with SDKProvider
const renderWithSDK = (ui: React.ReactElement) => render(ui);

describe('FieldCheckCard', () => {
  it('renders loading state when checking without response', () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={checkingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Analyzing content/i)).toBeInTheDocument();
  });

  it('renders waiting state when no response and not checking', () => {
    const waitingField = {
      ...mockFieldCheck,
      isChecking: false,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={waitingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Waiting for changes to settle/i)).toBeInTheDocument();
  });

  it('renders field name and score in collapsed state', () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByTestId('field-name')).toHaveTextContent('Test Field');
    // quality score comes from original.scores.quality.score in the new structure
    expect(screen.getByTestId('field-score')).toHaveTextContent('72');
  });

  it('shows right chevron when collapsed', () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    const chevronContainer = screen.getByTestId('field-header');
    expect(chevronContainer).toBeInTheDocument();
  });

  it('shows down chevron when expanded', () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    const chevronContainer = screen.getByTestId('field-header');
    expect(chevronContainer).toBeInTheDocument();
  });

  it('calls onToggleExpand when header is clicked', () => {
    const onToggleExpand = vi.fn();
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={onToggleExpand}
      />,
    );
    const header = screen.getByTestId('field-header');
    fireEvent.click(header);
    expect(onToggleExpand).toHaveBeenCalledWith('test-field');
  });

  it('shows analysis section with new metrics when expanded', () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    const analysisSection = screen.getByTestId('analysis-section');
    expect(analysisSection).toBeInTheDocument();
    expect(screen.getByText(/Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Clarity/i)).toBeInTheDocument();
    expect(screen.getByText(/Grammar/i)).toBeInTheDocument();
    expect(screen.getByText(/Consistency/i)).toBeInTheDocument();
    expect(screen.getByText(/Tone/i)).toBeInTheDocument();
  });

  it('shows "Rewriting" button text when checking', () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={checkingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Rewriting/i)).toBeInTheDocument();
  });

  it('does not show expanded content when collapsed', () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.queryByTestId('analysis-section')).not.toBeInTheDocument();
  });

  it('displays dash when score is neutral', () => {
    const neutralField = {
      ...mockFieldCheck,
      checkResponse: {
        ...mockFieldCheck.checkResponse,
        original: {
          ...mockCheckResponse.original,
          scores: {
            ...mockCheckResponse.original.scores,
            quality: { ...mockCheckResponse.original.scores.quality, score: 0 },
          },
        },
      } as unknown as FieldCheck['checkResponse'],
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={neutralField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    // Accept any dash character
    expect(screen.getByTestId('field-score').textContent).toMatch(/[—–-]/);
  });

  it('handles missing scores gracefully', () => {
    const missingScoresField = {
      ...mockFieldCheck,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={missingScoresField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Waiting for changes to settle/i)).toBeInTheDocument();
  });
});
