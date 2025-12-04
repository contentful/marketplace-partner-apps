import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("renders with the provided message", () => {
    const testMessage = "Loading...";
    render(<LoadingState message={testMessage} />);

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it("renders loading dots", () => {
    const { container } = render(<LoadingState message="Loading..." />);
    const dots = container.querySelectorAll('div[data-testid="loading-dot"]');
    expect(dots).toHaveLength(3);
  });

  it("applies correct styling classes", () => {
    const { container } = render(<LoadingState message="Loading..." />);
    expect(container.querySelector('div[data-testid="loading-container"]')).toBeInTheDocument();
    expect(container.querySelector('div[data-testid="loading-dots"]')).toBeInTheDocument();
  });
});
