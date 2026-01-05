import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonCard } from "./ComparisonCard";

describe("ComparisonCard", () => {
  const mockProps = {
    label: "Grammar Score",
    initialValue: 75.5,
    improvedValue: 85.5,
  };

  it("renders the label", () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText(mockProps.label)).toBeInTheDocument();
  });

  it("renders initial and improved values", () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText("75.50")).toBeInTheDocument();
    expect(screen.getByText("85.50")).toBeInTheDocument();
  });

  it("renders the difference with correct sign", () => {
    render(<ComparisonCard {...mockProps} />);
    expect(screen.getByText("(+10.00)")).toBeInTheDocument();
  });

  it("renders the arrow with correct rotation for improvement", () => {
    const { container } = render(<ComparisonCard {...mockProps} />);
    const arrow = container.querySelector("svg");
    if (!arrow) throw new Error("Arrow SVG not found");
    expect(arrow.getAttribute("style")).toContain("transform: rotate(0deg)");
  });

  it("renders the arrow with correct rotation for decrease", () => {
    const { container } = render(
      <ComparisonCard label="Grammar Score" initialValue={85.5} improvedValue={75.5} />,
    );
    const arrow = container.querySelector("svg");
    if (!arrow) throw new Error("Arrow SVG not found");
    expect(arrow.getAttribute("style")).toContain("transform: rotate(90deg)");
  });

  it("applies correct styling to card", () => {
    const { container } = render(<ComparisonCard {...mockProps} />);
    // The card is the root element with flex display and background color
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveStyleRule("display", "flex");
    expect(card).toHaveStyleRule("flex-direction", "row");
    expect(card).toHaveStyleRule("align-items", "center");
    expect(card).toHaveStyleRule("padding", "10px");
    expect(card).toHaveStyleRule("gap", "6px");
    expect(card).toHaveStyleRule("width", "100%");
    expect(card).toHaveStyleRule("height", "auto");
    expect(card).toHaveStyleRule("background", "#f7f9fa");
    expect(card).toHaveStyleRule("border-radius", "6px");
  });
});
