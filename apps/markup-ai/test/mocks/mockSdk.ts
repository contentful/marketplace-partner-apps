import { vi } from "vitest";

interface MockSDK {
  app: {
    onConfigure: ReturnType<typeof vi.fn>;
    getParameters: ReturnType<typeof vi.fn>;
    setReady: ReturnType<typeof vi.fn>;
    getCurrentState: ReturnType<typeof vi.fn>;
  };
  ids: {
    app: string;
  };
  window: {
    updateHeight: ReturnType<typeof vi.fn>;
  };
  notifier: {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  close: ReturnType<typeof vi.fn>;
  entry: {
    fields: {
      [key: string]: { name: string };
    };
  };
  dialogs: {
    openCurrent: ReturnType<typeof vi.fn>;
  };
  parameters: {
    invocation: {
      original: string;
      suggestion: string;
      score: number;
      originalScore: number;
      goalScores: Array<{
        label: string;
        score: number;
        color: string;
        bar: string;
      }>;
      analysis: {
        avg_sentence_length: number;
        avg_word_length: number;
        complexity_score: number;
        readability_score: number;
        sentence_count: number;
        vocabulary_score: number;
        word_count: number;
      };
      improvedAnalysis: {
        avg_sentence_length: number;
        avg_word_length: number;
        complexity_score: number;
        readability_score: number;
        sentence_count: number;
        vocabulary_score: number;
        word_count: number;
      };
      analysisTime: string;
    };
    installation: {
      apiKey: string;
      dialect: string;
      tone: string;
      styleGuide: string;
    };
  };
}

const mockSdk: MockSDK = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: "test-app",
  },
  window: {
    updateHeight: vi.fn(),
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  close: vi.fn(),
  entry: {
    fields: {
      field1: { name: "Field 1" },
      field2: { name: "Field 2" },
    },
  },
  dialogs: {
    openCurrent: vi.fn().mockResolvedValue({ accepted: false }),
  },
  parameters: {
    invocation: {
      original: "Original text",
      suggestion: "Improved text",
      score: 95,
      originalScore: 75,
      goalScores: [
        { label: "Grammar", score: 90, color: "#008539", bar: "#E6F4EA" },
        { label: "Style", score: 85, color: "#FFB020", bar: "#FFF4E5" },
      ],
      analysis: {
        avg_sentence_length: 15.5,
        avg_word_length: 4.2,
        complexity_score: 75.8,
        readability_score: 82.3,
        sentence_count: 10,
        vocabulary_score: 88.5,
        word_count: 155,
      },
      improvedAnalysis: {
        avg_sentence_length: 12.3,
        avg_word_length: 4,
        complexity_score: 85.2,
        readability_score: 90.1,
        sentence_count: 12,
        vocabulary_score: 92.3,
        word_count: 148,
      },
      analysisTime: "2 minutes ago",
    },
    installation: {
      apiKey: "test-api-key",
      dialect: "en-US",
      tone: "professional",
      styleGuide: "default",
    },
  },
};

export { mockSdk, type MockSDK };
