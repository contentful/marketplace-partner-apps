import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../test/utils/testUtils";
import { FieldHeader } from "./FieldHeader";

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof FieldHeader>> = {},
): React.ComponentProps<typeof FieldHeader> {
  return {
    onCheckClick: vi.fn(),
    ...overrides,
  };
}

describe("FieldHeader", () => {
  it("invokes onCheckClick when the Markup AI button is clicked", () => {
    const onCheckClick = vi.fn();
    const { getByRole } = render(<FieldHeader {...defaultProps({ onCheckClick })} />);
    fireEvent.click(getByRole("button", { name: /markup ai/i }));
    expect(onCheckClick).toHaveBeenCalledTimes(1);
  });

  it("disables the Check button when isDisabled is set", () => {
    const onCheckClick = vi.fn();
    const { getByRole } = render(
      <FieldHeader {...defaultProps({ onCheckClick, isDisabled: true })} />,
    );
    const button = getByRole("button", { name: /markup ai/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onCheckClick).not.toHaveBeenCalled();
  });

  it("disables the Check button with the reason wiring when checkDisabledReason is set", () => {
    const reason = "Style agent is disabled for your organization. Contact support to enable it.";
    const { container, getAllByRole } = render(
      <FieldHeader {...defaultProps({ isDisabled: true, checkDisabledReason: reason })} />,
    );
    // Two role="button" elements now: the DisabledTooltipTarget wrapper span
    // and the inner native button. Pick the native one for the disabled
    // assertion, and the wrapper span for the a11y assertions.
    const buttons = getAllByRole("button", { name: /markup ai/i });
    const native = buttons.find((b) => b.tagName === "BUTTON") as HTMLButtonElement;
    expect(native.disabled).toBe(true);
    const wrapper = container.querySelector('span[aria-disabled="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("tabindex")).toBe("0");
  });
});
