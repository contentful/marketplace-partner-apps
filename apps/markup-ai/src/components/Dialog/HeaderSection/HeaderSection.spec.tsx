import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeaderSection } from "./HeaderSection";

describe("HeaderSection", () => {
  const mockProps = {
    title: "Analysis Results",
    analysisTime: "2 minutes ago",
  };

  it("renders title and analysis time", () => {
    render(<HeaderSection {...mockProps} />);

    expect(screen.getByText(mockProps.title)).toBeInTheDocument();
    expect(screen.getByText(mockProps.analysisTime)).toBeInTheDocument();
  });

  it("renders the icon placeholder", () => {
    const { container } = render(<HeaderSection {...mockProps} />);
    const icon = container.querySelector('div[style*="border-radius: 50%"]');
    expect(icon).toBeInTheDocument();
  });

  it("applies correct styling to header", () => {
    const { container } = render(<HeaderSection {...mockProps} />);
    const header = container.querySelector(".dialog-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveStyle({
      display: "flex",
      alignItems: "center",
      padding: "16px 16px 16px 24px",
      gap: "8px",
      borderBottom: "1px solid #E7EBEE",
    });
  });
});
