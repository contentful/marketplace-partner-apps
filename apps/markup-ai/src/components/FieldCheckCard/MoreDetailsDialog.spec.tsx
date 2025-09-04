import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { MoreDetailsDialog } from './MoreDetailsDialog';
import { LocalizationProvider } from '../../contexts/LocalizationContext';
import type { DialogAppSDK } from '@contentful/app-sdk';

let mockUseSDKReturn: Partial<DialogAppSDK> = {};
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockUseSDKReturn,
  useAutoResizer: () => {},
}));

const mockScores = {
  quality: {
    score: 82,
    grammar: { score: 90, issues: 1 },
    style_guide: { score: 85, issues: 2 },
    terminology: { score: 60, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 80,
      word_count: 100,
      sentence_count: 10,
      average_sentence_length: 10,
      sentence_complexity: 2,
      vocabulary_complexity: 1.5,
      flesch_reading_ease: 70,
    },
    tone: { score: 75, informality: 0.5, liveliness: 0.7 },
  },
};

// Helper function to render with LocalizationProvider wrapped in act
const renderWithLocalization = async (component: React.ReactElement) => {
  let result;
  await act(async () => {
    result = render(<LocalizationProvider>{component}</LocalizationProvider>);
  });
  return result!;
};

beforeEach(() => {
  mockUseSDKReturn = {};
});

describe('MoreDetailsDialog', () => {
  it('renders all main metrics and sub-metrics', async () => {
    mockUseSDKReturn = {
      parameters: {
        invocation: {
          checkResponse: {
            scores: mockScores,
            check_options: {
              style_guide: { style_guide_type: 'ap' },
              dialect: 'american_english',
              tone: 'formal',
            },
          },
        },
      },
    } as unknown as Partial<DialogAppSDK>;
    await renderWithLocalization(<MoreDetailsDialog />);
    expect(screen.getByText('Clarity')).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getAllByText('Style Guide')).toHaveLength(2); // One in config, one in metrics
    expect(screen.getAllByText('Tone')).toHaveLength(2); // One in config, one in metrics
    expect(screen.getByText('Terminology')).toBeInTheDocument();

    // Check Analysis Configuration section (no title, just the values)
    expect(screen.getByText('AP')).toBeInTheDocument();
    expect(screen.getByText('American English')).toBeInTheDocument();
    expect(screen.getByText('Formal')).toBeInTheDocument();

    // No section title label anymore
  });

  it('handles missing/partial data gracefully', async () => {
    mockUseSDKReturn = {
      parameters: {
        invocation: {
          checkResponse: {
            scores: {
              quality: {
                score: 0,
                grammar: { score: 50, issues: 0 },
                style_guide: { score: 0, issues: 0 },
                terminology: { score: 0, issues: 0 },
              },
              analysis: {},
            },
            check_options: {
              style_guide: { style_guide_type: undefined },
              dialect: undefined,
              tone: undefined,
            },
          },
        },
      },
    } as unknown as Partial<DialogAppSDK>;
    await renderWithLocalization(<MoreDetailsDialog />);
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    // Should show dashes or empty for missing sub-metrics
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
