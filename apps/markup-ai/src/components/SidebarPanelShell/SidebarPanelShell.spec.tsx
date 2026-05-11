import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../test/utils/testUtils";
import { SidebarPanelShell } from "./SidebarPanelShell";

describe("SidebarPanelShell", () => {
  it("renders the title and child content", () => {
    const { getByText } = render(
      <SidebarPanelShell title="Settings" onBack={vi.fn()}>
        <p>body content</p>
      </SidebarPanelShell>,
    );
    expect(getByText("Settings")).toBeInTheDocument();
    expect(getByText("body content")).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", () => {
    const onBack = vi.fn();
    const { getByRole } = render(
      <SidebarPanelShell title="Settings" onBack={onBack}>
        <p>body</p>
      </SidebarPanelShell>,
    );
    fireEvent.click(getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("respects a custom backLabel for the back button aria-label", () => {
    const { getByRole } = render(
      <SidebarPanelShell title="Settings" onBack={vi.fn()} backLabel="Back to suggestions">
        <p>body</p>
      </SidebarPanelShell>,
    );
    expect(getByRole("button", { name: /back to suggestions/i })).toBeInTheDocument();
  });
});
