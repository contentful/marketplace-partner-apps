import { describe, expect, it, vi } from "vitest";
import { render } from "../../../../../../test/utils/testUtils";
import { AuditTrailPopover } from "./AuditTrailPopover";

describe("AuditTrailPopover", () => {
  it("renders the trigger element", () => {
    const { getByRole } = render(
      <AuditTrailPopover
        isOpen={false}
        onOpenChange={vi.fn()}
        trigger={<button type="button">Open</button>}
        severityCounts={{ high: 0, medium: 0, low: 0 }}
        appliedCount={0}
        dismissedCount={0}
      />,
    );
    expect(getByRole("button", { name: /open/i })).toBeInTheDocument();
  });

  it("renders the breakdown rows when isOpen is true", () => {
    const { getByText } = render(
      <AuditTrailPopover
        isOpen
        onOpenChange={vi.fn()}
        trigger={<button type="button">Open</button>}
        severityCounts={{ high: 7, medium: 15, low: 2 }}
        appliedCount={3}
        dismissedCount={4}
      />,
    );
    expect(getByText("Issue breakdown")).toBeInTheDocument();
    expect(getByText("High")).toBeInTheDocument();
    expect(getByText("Medium")).toBeInTheDocument();
    expect(getByText("Low")).toBeInTheDocument();
    expect(getByText("Applied")).toBeInTheDocument();
    expect(getByText("Dismissed")).toBeInTheDocument();
    expect(getByText("7")).toBeInTheDocument();
    expect(getByText("15")).toBeInTheDocument();
    expect(getByText("2")).toBeInTheDocument();
    expect(getByText("3")).toBeInTheDocument();
    expect(getByText("4")).toBeInTheDocument();
  });
});
