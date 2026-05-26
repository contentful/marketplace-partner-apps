import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import React from "react";
import { render } from "../../../test/utils/testUtils";
import { DisabledTooltipTarget } from "./DisabledTooltipTarget";

// `getByRole("button")` would match both the wrapper span and the native
// button (a disabled button still has the button role); querying for the
// span by tag keeps the wrapper unambiguous.
function findWrapperSpan(container: HTMLElement): HTMLSpanElement {
  const span = container.querySelector("span[aria-disabled]");
  if (!span) throw new Error("no DisabledTooltipTarget span found");
  return span as HTMLSpanElement;
}

describe("DisabledTooltipTarget", () => {
  it("renders a focusable span with aria-disabled=true and the supplied role", () => {
    const { container } = render(
      <DisabledTooltipTarget role="button">
        <button disabled>Markup AI</button>
      </DisabledTooltipTarget>,
    );
    const wrapper = findWrapperSpan(container);
    expect(wrapper.getAttribute("tabindex")).toBe("0");
    expect(wrapper.getAttribute("aria-disabled")).toBe("true");
    expect(wrapper.getAttribute("role")).toBe("button");
  });

  it("supports the switch role for wrapped Switch controls", () => {
    const { container } = render(
      <DisabledTooltipTarget role="switch">
        <input type="checkbox" disabled aria-label="Enable" />
      </DisabledTooltipTarget>,
    );
    const wrapper = findWrapperSpan(container);
    expect(wrapper.getAttribute("role")).toBe("switch");
    expect(wrapper.getAttribute("aria-disabled")).toBe("true");
  });

  it("forwards ref and spreads tooltip-injected props onto the span", () => {
    const ref = React.createRef<HTMLSpanElement>();
    const onMouseEnter = vi.fn();
    const { container } = render(
      <DisabledTooltipTarget
        role="button"
        ref={ref}
        onMouseEnter={onMouseEnter}
        aria-describedby="tooltip-1"
      >
        <button disabled>X</button>
      </DisabledTooltipTarget>,
    );
    const wrapper = findWrapperSpan(container);
    expect(ref.current).toBe(wrapper);
    expect(wrapper.getAttribute("aria-describedby")).toBe("tooltip-1");
    fireEvent.mouseEnter(wrapper);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });
});
