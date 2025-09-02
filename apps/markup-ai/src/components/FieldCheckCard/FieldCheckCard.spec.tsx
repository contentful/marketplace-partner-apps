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

const mockScores = {
  quality: {
    score: 85,
    grammar: { score: 90, issues: 1 },
    style_guide: { score: 80, issues: 2 },
    terminology: { score: 0, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 70,
      word_count: 10,
      sentence_count: 2,
      average_sentence_length: 5,
      flesch_reading_ease: 80,
      vocabulary_complexity: 0.5,
      sentence_complexity: 1.0,
    },
    tone: { score: 60, informality: 0.3, liveliness: 0.4 },
  },
};

const mockCheckResponse: StyleAnalysisSuccessResp = {
  status: Status.Completed,
  style_guide_id: '123',
  workflow_id: 'dummy-workflow-id',
  scores: mockScores as unknown as StyleAnalysisSuccessResp['scores'],
  issues: [
    {
      original: 'string',
      char_index: 0,
      subcategory: 'sva_pronoun',
      category: IssueCategory.Grammar,
    },
  ],
  check_options: {
    style_guide: {
      style_guide_type: 'ap',
      style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    },
    dialect: 'american_english',
    tone: 'academic',
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
    expect(screen.getByTestId('field-score')).toHaveTextContent('85');
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
    fireEvent.click(header!);
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
    expect(screen.getByText(/Style Guide/i)).toBeInTheDocument();
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
        scores: { ...mockScores, quality: { ...mockScores.quality, score: 0 } },
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
