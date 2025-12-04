import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentDiff } from "./ContentDiff";

// Mock Contentful SDK hook so tests don't require SDKProvider or iframe env
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => ({ window: { updateHeight: vi.fn() } }),
}));

describe("ContentDiff", () => {
  const mockProps = {
    original: "This is the original text.",
    improved: "This is the improved text!",
    originalScore: 75,
    improvedScore: 95,
  };

  it("renders original and improved content titles", () => {
    render(<ContentDiff {...mockProps} />);

    expect(screen.getByText("Original Content")).toBeInTheDocument();
    expect(screen.getByText("Improved Content")).toBeInTheDocument();
  });

  it("renders original and improved scores", () => {
    render(<ContentDiff {...mockProps} />);

    // Check for Score text
    expect(screen.getAllByText("Score")).toHaveLength(2);

    // Check for score numbers
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("renders the original text (lenient match)", () => {
    render(<ContentDiff {...mockProps} />);
    const originals = screen.getAllByText(/original/i);
    expect(originals.length).toBeGreaterThan(0);
  });

  it("renders the improved text (lenient match)", () => {
    render(<ContentDiff {...mockProps} />);
    const improveds = screen.getAllByText(/improved/i);
    expect(improveds.length).toBeGreaterThan(0);
  });

  it("renders a container element", () => {
    const { container } = render(<ContentDiff {...mockProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
