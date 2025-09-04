import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils/testUtils';
import Dialog from './Dialog';
import { useSDK } from '@contentful/react-apps-toolkit';
import { mockSdk } from '../../../test/mocks/mockSdk';
import * as rewriterService from '../../services/rewriterService';
import { Status } from '@markupai/toolkit';

// Mock the SDK
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

describe('Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(rewriterService, 'rewriteContent').mockResolvedValue({
      fieldId: 'field1',
      originalValue: 'Original text',
      isChecking: false,
      checkResponse: {
        rewrite: 'Improved text',
        scores: {
          quality: {
            score: 75,
            grammar: { score: 80, issues: 0 },
            style_guide: { score: 70, issues: 0 },
            terminology: { score: 0, issues: 0 },
          },
          analysis: {
            clarity: {
              score: 60,
              word_count: 0,
              sentence_count: 0,
              average_sentence_length: 0,
              flesch_reading_ease: 0,
              vocabulary_complexity: 0,
              sentence_complexity: 0,
            },
            tone: { score: 65, informality: 0, liveliness: 0, informality_alignment: 0, liveliness_alignment: 0 },
          },
        },
        rewrite_scores: {
          quality: {
            score: 90,
            grammar: { score: 95, issues: 0 },
            style_guide: { score: 88, issues: 0 },
            terminology: { score: 0, issues: 0 },
          },
          analysis: {
            clarity: {
              score: 85,
              word_count: 0,
              sentence_count: 0,
              average_sentence_length: 0,
              flesch_reading_ease: 0,
              vocabulary_complexity: 0,
              sentence_complexity: 0,
            },
            tone: { score: 80, informality: 0, liveliness: 0, informality_alignment: 0, liveliness_alignment: 0 },
          },
        },
        issues: [],
        status: Status.Completed,
        style_guide_id: 'default',
        check_options: {
          style_guide: { style_guide_type: 'default', style_guide_id: 'default' },
          dialect: 'en-US',
          tone: 'neutral',
        },
        workflow_id: 'dummy-workflow-id',
      },
      error: null,
      lastUpdated: Date.now(),
      hasRewriteResult: true,
    });
    (useSDK as Mock).mockReturnValue({
      ...mockSdk,
      parameters: {
        invocation: {
          fieldId: 'field1',
          original: 'Original text',
          originalScore: 75,
          startRewrite: true,
        },
        installation: {
          apiKey: 'dummy-key',
          dialect: 'en-US',
          tone: 'neutral',
          styleGuide: 'default',
        },
      },
    });
  });

  it('renders the dialog with all sections', async () => {
    render(<Dialog />);
    expect(await screen.findByText('Improvement Summary')).toBeInTheDocument();
    expect(await screen.findByText('Accept & Insert')).toBeInTheDocument();
    expect(await screen.findByText('Reject & Close')).toBeInTheDocument();
  });

  it('renders the action buttons', async () => {
    render(<Dialog />);
    expect(await screen.findByText('Reject & Close')).toBeInTheDocument();
    expect(await screen.findByText('Accept & Insert')).toBeInTheDocument();
  });

  it('calls SDK close with correct parameters on accept', async () => {
    render(<Dialog />);
    const acceptButton = await screen.findByText('Accept & Insert');
    await waitFor(() => expect(acceptButton).not.toBeDisabled());
    fireEvent.click(acceptButton);
    await waitFor(() => {
      expect(mockSdk.close).toHaveBeenCalledWith(expect.objectContaining({ accepted: true }));
    });
  });

  it('calls SDK close with correct parameters on reject', async () => {
    render(<Dialog />);
    await waitFor(() => {
      expect(screen.getByText('Reject & Close')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Reject & Close'));
    await waitFor(() => {
      expect(mockSdk.close).toHaveBeenCalledWith({ accepted: false });
    });
  });

  it('updates window height when content changes', async () => {
    render(<Dialog />);
    await waitFor(() => {
      expect(mockSdk.window.updateHeight).toHaveBeenCalled();
    });
  });

  it('renders ContentDiff without error when original or improved is empty', async () => {
    vi.spyOn(rewriterService, 'rewriteContent').mockResolvedValue({
      fieldId: 'field1',
      originalValue: '',
      isChecking: false,
      checkResponse: {
        rewrite: '',
        scores: {
          quality: {
            score: 0,
            grammar: { score: 0, issues: 0 },
            style_guide: { score: 0, issues: 0 },
            terminology: { score: 0, issues: 0 },
          },
          analysis: {
            clarity: {
              score: 0,
              word_count: 0,
              sentence_count: 0,
              average_sentence_length: 0,
              flesch_reading_ease: 0,
              vocabulary_complexity: 0,
              sentence_complexity: 0,
            },
            tone: { score: 0, informality: 0, liveliness: 0, informality_alignment: 0, liveliness_alignment: 0 },
          },
        },
        rewrite_scores: {
          quality: {
            score: 0,
            grammar: { score: 0, issues: 0 },
            style_guide: { score: 0, issues: 0 },
            terminology: { score: 0, issues: 0 },
          },
          analysis: {
            clarity: {
              score: 0,
              word_count: 0,
              sentence_count: 0,
              average_sentence_length: 0,
              flesch_reading_ease: 0,
              vocabulary_complexity: 0,
              sentence_complexity: 0,
            },
            tone: { score: 0, informality: 0, liveliness: 0, informality_alignment: 0, liveliness_alignment: 0 },
          },
        },
        issues: [],
        status: Status.Completed,
        style_guide_id: 'default',
        check_options: {
          style_guide: { style_guide_type: 'default', style_guide_id: 'default' },
          dialect: 'en-US',
          tone: 'neutral',
        },
        workflow_id: 'dummy-workflow-id',
      },
      error: null,
      lastUpdated: Date.now(),
      hasRewriteResult: true,
    });
    (useSDK as Mock).mockReturnValue({
      ...mockSdk,
      parameters: {
        invocation: {
          fieldId: 'field1',
          original: '',
          originalScore: 0,
          startRewrite: true,
        },
        installation: {
          apiKey: 'dummy-key',
          dialect: 'en-US',
          tone: 'neutral',
          styleGuide: 'default',
        },
      },
    });
    render(<Dialog />);
    expect(await screen.findByText('Improvement Summary')).toBeInTheDocument();
  });
});
