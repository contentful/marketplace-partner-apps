import { describe, it, expect } from "vitest";
import { render, screen } from "../../../../test/utils/testUtils";
import { AnalysisResultsComparison } from "./AnalysisResultsComparison";

const mockInitialScores = {
  quality: {
    score: 70,
    grammar: { score: 75, issues: 2 },
    consistency: { score: 65, issues: 3 },
    terminology: { score: 0, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 60,
      word_count: 90,
      sentence_count: 9,
      average_sentence_length: 10,
      flesch_reading_ease: 65,
      vocabulary_complexity: 4,
      sentence_complexity: 1.2,
    },
    tone: {
      score: 55,
      informality: 2,
      liveliness: 1,
      informality_alignment: 0,
      liveliness_alignment: 0,
    },
  },
};

const mockImprovedScores = {
  quality: {
    score: 85,
    grammar: { score: 90, issues: 1 },
    consistency: { score: 85, issues: 2 },
    terminology: { score: 0, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 80,
      word_count: 100,
      sentence_count: 10,
      average_sentence_length: 10,
      flesch_reading_ease: 70,
      vocabulary_complexity: 5,
      sentence_complexity: 1.1,
    },
    tone: {
      score: 80,
      informality: 1,
      liveliness: 2,
      informality_alignment: 0,
      liveliness_alignment: 0,
    },
  },
};

describe("AnalysisResultsComparison", () => {
  it("renders all metric labels", () => {
    render(<AnalysisResultsComparison initial={mockInitialScores} improved={mockImprovedScores} />);
    expect(screen.getByText("Clarity")).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Consistency")).toBeInTheDocument();
    expect(screen.getByText("Tone")).toBeInTheDocument();
  });

  it("renders correct improved and initial values", () => {
    render(<AnalysisResultsComparison initial={mockInitialScores} improved={mockImprovedScores} />);
    // Improved values
    expect(screen.getAllByText("80.00").length).toBe(2); // Improved clarity and tone
    expect(screen.getByText("90.00")).toBeInTheDocument(); // Improved grammar
    expect(screen.getByText("85.00")).toBeInTheDocument(); // Improved style_guide
    // Initial values
    expect(screen.getByText("60.00")).toBeInTheDocument(); // Initial clarity
    expect(screen.getByText("75.00")).toBeInTheDocument(); // Initial grammar
    expect(screen.getByText("65.00")).toBeInTheDocument(); // Initial style_guide
    expect(screen.getByText("55.00")).toBeInTheDocument(); // Initial tone
  });

  it("applies correct styling to container", () => {
    const { container } = render(
      <AnalysisResultsComparison initial={mockInitialScores} improved={mockImprovedScores} />,
    );
    const wrapper = container.querySelector('div[class*="css-"]');
    expect(wrapper).toBeInTheDocument();
  });

  it("renders 0 for missing metrics without throwing", () => {
    const partialInitial = {
      quality: {
        score: 0,
        grammar: { score: 0, issues: 0 },
        consistency: { score: 0, issues: 0 },
        terminology: { score: 0, issues: 0 },
      },
      analysis: {
        clarity: {
          score: 10,
          word_count: 0,
          sentence_count: 0,
          average_sentence_length: 0,
          flesch_reading_ease: 0,
          vocabulary_complexity: 0,
          sentence_complexity: 0,
        },
        tone: {
          score: 0,
          informality: 0,
          liveliness: 0,
          informality_alignment: 0,
          liveliness_alignment: 0,
        },
      },
    };
    const partialImproved = {
      quality: {
        score: 0,
        grammar: { score: 0, issues: 0 },
        consistency: { score: 0, issues: 0 },
        terminology: { score: 0, issues: 0 },
      },
      analysis: {
        clarity: {
          score: 20,
          word_count: 0,
          sentence_count: 0,
          average_sentence_length: 0,
          flesch_reading_ease: 0,
          vocabulary_complexity: 0,
          sentence_complexity: 0,
        },
        tone: {
          score: 0,
          informality: 0,
          liveliness: 0,
          informality_alignment: 0,
          liveliness_alignment: 0,
        },
      },
    };
    render(<AnalysisResultsComparison initial={partialInitial} improved={partialImproved} />);
    expect(screen.getByText("10.00")).toBeInTheDocument(); // initial clarity
    expect(screen.getByText("20.00")).toBeInTheDocument(); // improved clarity
    // Other metrics should render 0
    expect(screen.getAllByText("0.00").length).toBeGreaterThan(0);
  });
});
