import React from "react";

export interface DisabledTooltipTargetProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Wrapped disabled control (Button, Switch, etc). The wrapper is required
   * because disabled native elements can't receive focus or hover events,
   * so f36's `Tooltip` would otherwise never fire.
   */
  children: React.ReactNode;
  /**
   * Semantic role announced to assistive tech. Match the role of the
   * wrapped control — `"button"` for a disabled Button, `"switch"` for a
   * disabled Switch — so screen readers announce "<name>, dimmed/disabled"
   * when the wrapper takes focus.
   */
  role: "button" | "switch";
}

/**
 * Focusable wrapper for a disabled control inside an f36 `Tooltip`. Adds
 * `tabIndex={0}`, the appropriate `role`, and `aria-disabled="true"` so
 * keyboard users get the tooltip on focus and screen readers announce the
 * disabled state. f36's Tooltip injects mouse/focus listeners and an
 * `aria-describedby` reference via cloneElement, so we spread incoming
 * props onto the underlying span and forward the ref.
 */
export const DisabledTooltipTarget = React.forwardRef<HTMLSpanElement, DisabledTooltipTargetProps>(
  ({ children, role, ...rest }, ref) => (
    <span
      ref={ref}
      tabIndex={0} // NOSONAR(typescript:S6845): role is "button" | "switch" — both interactive ARIA roles; Sonar can't see through the prop's union type
      role={role}
      aria-disabled="true"
      {...rest}
    >
      {children}
    </span>
  ),
);

DisabledTooltipTarget.displayName = "DisabledTooltipTarget";
