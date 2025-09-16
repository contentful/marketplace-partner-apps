import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils/testUtils';
import Dialog from './Dialog';
import { useSDK } from '@contentful/react-apps-toolkit';
import { mockSdk } from '../../../test/mocks/mockSdk';
import * as rewriterService from '../../services/rewriterService';
import { IssueCategory, Status } from '@markupai/toolkit';

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
        workflow: {
          id: 'rewrites-3fa85f64-5717-4562-b3fc-2c963f66afa6',
          type: 'rewrites',
          api_version: '1.0.0',
          generated_at: '2025-01-15T15:12:45Z',
          status: Status.Completed,
          webhook_response: {
            url: 'https://api.example.com/webhook',
            status_code: 200,
          },
        },
        config: {
          dialect: 'american_english',
          style_guide: {
            style_guide_type: 'chicago',
            style_guide_id: 'sg-7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e',
          },
          tone: 'academic',
        },
        original: {
          issues: [
            {
              original: 'recieve',
              position: {
                start_index: 42,
              },
              subcategory: 'spelling',
              suggestion: 'receive',
              category: IssueCategory.Grammar,
            },
            {
              original: 'data',
              position: {
                start_index: 156,
              },
              subcategory: 'word_choice',
              suggestion: 'information',
              category: IssueCategory.Grammar,
            },
            {
              original: 'ok',
              position: {
                start_index: 203,
              },
              subcategory: 'capitalization',
              suggestion: 'OK',
              category: IssueCategory.Consistency,
            },
          ],
          scores: {
            quality: {
              score: 75,
              grammar: {
                score: 85,
                issues: 2,
              },
              consistency: {
                score: 70,
                issues: 3,
              },
              terminology: {
                score: 95,
                issues: 1,
              },
            },
            analysis: {
              clarity: {
                score: 68,
                flesch_reading_ease: 45.2,
                sentence_complexity: 42.5,
                vocabulary_complexity: 38.7,
                sentence_count: 4,
                word_count: 52,
                average_sentence_length: 13,
              },
              tone: {
                score: 72,
                informality: 35.8,
                liveliness: 28.4,
                informality_alignment: 112.5,
                liveliness_alignment: 94.3,
              },
            },
          },
        },
        rewrite: {
          text: 'The updated document maintains clarity while following style guidelines. Information flows logically from introduction through supporting details. Technical terms are defined appropriately. The conclusion summarizes key points effectively.',
          scores: {
            quality: {
              score: 98,
              grammar: {
                score: 100,
                issues: 0,
              },
              consistency: {
                score: 95,
                issues: 1,
              },
              terminology: {
                score: 100,
                issues: 0,
              },
            },
            analysis: {
              clarity: {
                score: 82,
                flesch_reading_ease: 52.8,
                sentence_complexity: 35.2,
                vocabulary_complexity: 41.3,
                sentence_count: 4,
                word_count: 48,
                average_sentence_length: 12,
              },
              tone: {
                score: 88,
                informality: 32.1,
                liveliness: 30.6,
                informality_alignment: 102.4,
                liveliness_alignment: 98.7,
              },
            },
          },
        },
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
        workflow: {
          id: 'rewrites-3fa85f64-5717-4562-b3fc-2c963f66afa6',
          type: 'rewrites',
          api_version: '1.0.0',
          generated_at: '2025-01-15T15:12:45Z',
          status: Status.Completed,
          webhook_response: {
            url: 'https://api.example.com/webhook',
            status_code: 200,
          },
        },
        config: {
          dialect: 'american_english',
          style_guide: {
            style_guide_type: 'chicago',
            style_guide_id: 'sg-7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e',
          },
          tone: 'academic',
        },
        original: {
          issues: [
            {
              original: 'recieve',
              position: {
                start_index: 42,
              },
              subcategory: 'spelling',
              suggestion: 'receive',
              category: IssueCategory.Grammar,
            },
            {
              original: 'data',
              position: {
                start_index: 156,
              },
              subcategory: 'word_choice',
              suggestion: 'information',
              category: IssueCategory.Grammar,
            },
            {
              original: 'ok',
              position: {
                start_index: 203,
              },
              subcategory: 'capitalization',
              suggestion: 'OK',
              category: IssueCategory.Consistency,
            },
          ],
          scores: {
            quality: {
              score: 75,
              grammar: {
                score: 85,
                issues: 2,
              },
              consistency: {
                score: 70,
                issues: 3,
              },
              terminology: {
                score: 95,
                issues: 1,
              },
            },
            analysis: {
              clarity: {
                score: 68,
                flesch_reading_ease: 45.2,
                sentence_complexity: 42.5,
                vocabulary_complexity: 38.7,
                sentence_count: 4,
                word_count: 52,
                average_sentence_length: 13,
              },
              tone: {
                score: 72,
                informality: 35.8,
                liveliness: 28.4,
                informality_alignment: 112.5,
                liveliness_alignment: 94.3,
              },
            },
          },
        },
        rewrite: {
          text: '',
          scores: {
            quality: {
              score: 98,
              grammar: {
                score: 100,
                issues: 0,
              },
              consistency: {
                score: 95,
                issues: 1,
              },
              terminology: {
                score: 100,
                issues: 0,
              },
            },
            analysis: {
              clarity: {
                score: 82,
                flesch_reading_ease: 52.8,
                sentence_complexity: 35.2,
                vocabulary_complexity: 41.3,
                sentence_count: 4,
                word_count: 48,
                average_sentence_length: 12,
              },
              tone: {
                score: 88,
                informality: 32.1,
                liveliness: 30.6,
                informality_alignment: 102.4,
                liveliness_alignment: 98.7,
              },
            },
          },
        },
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
