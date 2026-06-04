import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../test/utils/testUtils";
import { ContentTypeStyleGuideSelect } from "./ContentTypeStyleGuideSelect";
import type { TargetResponse } from "../../../api-client/types.gen";

const baseTargets: TargetResponse[] = [
  { id: "ap", display_name: "AP", is_default: true, enabled: true },
  { id: "chicago", display_name: "Chicago", is_default: false, enabled: true },
  { id: "disabled", display_name: "Disabled", is_default: false, enabled: false },
];

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof ContentTypeStyleGuideSelect>> = {},
) {
  return {
    contentTypeId: "blogPost",
    value: null,
    targets: baseTargets,
    isLoading: false,
    isError: false,
    isAuthenticated: true,
    onChange: vi.fn(),
    ...overrides,
  };
}

describe("ContentTypeStyleGuideSelect", () => {
  it("renders enabled targets and the no-default placeholder", () => {
    const { getByRole } = render(<ContentTypeStyleGuideSelect {...defaultProps()} />);
    const select = getByRole("combobox") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    // "" placeholder + AP + Chicago. Disabled target excluded.
    expect(optionValues).toEqual(["", "ap", "chicago"]);
  });

  it("disables and explains when not authenticated", () => {
    const { getByRole, getByText } = render(
      <ContentTypeStyleGuideSelect {...defaultProps({ isAuthenticated: false })} />,
    );
    expect((getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
    expect(getByText(/sign in to choose a default style guide/i)).toBeInTheDocument();
  });

  it("shows the loading help text and disabled state while loading", () => {
    const { getByRole, getByText } = render(
      <ContentTypeStyleGuideSelect {...defaultProps({ isLoading: true })} />,
    );
    expect((getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
    expect(getByText(/loading style guides/i)).toBeInTheDocument();
  });

  it("shows the error help text and disabled state on fetch failure", () => {
    const { getByRole, getByText } = render(
      <ContentTypeStyleGuideSelect {...defaultProps({ isError: true })} />,
    );
    expect((getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
    expect(getByText(/failed to load style guides/i)).toBeInTheDocument();
  });

  it("shows 'No style guides' help when the targets list has no enabled entries", () => {
    const { getByText } = render(
      <ContentTypeStyleGuideSelect
        {...defaultProps({
          targets: [{ id: "off", display_name: "Off", is_default: false, enabled: false }],
        })}
      />,
    );
    expect(getByText(/no style guides available for this account/i)).toBeInTheDocument();
  });

  it("emits onChange with the picked id when the user selects a target", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<ContentTypeStyleGuideSelect {...defaultProps({ onChange })} />);
    fireEvent.change(getByRole("combobox"), { target: { value: "chicago" } });
    expect(onChange).toHaveBeenCalledWith("blogPost", "chicago");
  });

  it("emits onChange with null when the user clears the selection", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ContentTypeStyleGuideSelect {...defaultProps({ value: "ap", onChange })} />,
    );
    fireEvent.change(getByRole("combobox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("blogPost", null);
  });
});
