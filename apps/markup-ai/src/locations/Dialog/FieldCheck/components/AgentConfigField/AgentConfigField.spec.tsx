import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../../../test/utils/testUtils";
import { AgentConfigField } from "./AgentConfigField";
import type { StyleGuideSummaryResponse } from "../../../../../api-client/types.gen";

// useStyleGuides is exercised by its own spec — stub it out here so the
// AgentConfigField tests focus on the prefetched/fallback wiring.
interface StyleGuidesResult {
  styleGuides: StyleGuideSummaryResponse[];
  isLoading: boolean;
  isError: boolean;
  defaultStyleGuideId: string | null;
}
const mockUseStyleGuides = vi.fn<(apiKey?: string | null) => StyleGuidesResult>();
vi.mock("../../../../../hooks/useStyleGuides", () => ({
  useStyleGuides: (apiKey?: string | null): StyleGuidesResult => mockUseStyleGuides(apiKey),
}));

const styleGuides: StyleGuideSummaryResponse[] = [
  { id: "ap", display_name: "AP", is_default: true, enabled: true },
  { id: "chicago", display_name: "Chicago", is_default: false, enabled: true },
];

describe("AgentConfigField — style_guide_select", () => {
  beforeEach(() => {
    mockUseStyleGuides.mockReset();
    mockUseStyleGuides.mockReturnValue({
      styleGuides: [],
      isLoading: false,
      isError: false,
      defaultStyleGuideId: null,
    });
  });

  it("uses prefetched style guides and skips the fallback hook fetch", () => {
    const { getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value=""
        onChange={vi.fn()}
        styleGuides={styleGuides}
        styleGuidesLoading={false}
        styleGuidesError={false}
      />,
    );
    // When prefetched style guides are supplied, the hook is invoked with `null`
    // (so it stays disabled) — we don't fan out a duplicate request.
    expect(mockUseStyleGuides).toHaveBeenCalledWith(null);
    const optionValues = Array.from((getByRole("combobox") as HTMLSelectElement).options).map(
      (o) => o.value,
    );
    expect(optionValues).toEqual(expect.arrayContaining(["ap", "chicago"]));
  });

  it("falls back to useStyleGuides(apiKey) when no prefetched style guides are passed", () => {
    mockUseStyleGuides.mockReturnValue({
      styleGuides,
      isLoading: false,
      isError: false,
      defaultStyleGuideId: "ap",
    });
    render(
      <AgentConfigField configKey="style_guide_id" value="" onChange={vi.fn()} apiKey="tok" />,
    );
    expect(mockUseStyleGuides).toHaveBeenCalledWith("tok");
  });

  it("shows the loading placeholder + disabled select when prefetchedLoading is true", () => {
    const { getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value=""
        onChange={vi.fn()}
        styleGuides={[]}
        styleGuidesLoading
        styleGuidesError={false}
      />,
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(select.options[0].textContent).toMatch(/loading/i);
  });

  it("shows 'No style guides' when prefetched style guides are empty", () => {
    const { getByText, getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value=""
        onChange={vi.fn()}
        styleGuides={[]}
        styleGuidesLoading={false}
        styleGuidesError={false}
      />,
    );
    expect(getByText(/no style guides available for this account/i)).toBeInTheDocument();
    expect((getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
  });

  it("renders an unknown saved id as a synthetic option so it stays selected", () => {
    const { getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value="ghost"
        onChange={vi.fn()}
        styleGuides={styleGuides}
        styleGuidesLoading={false}
        styleGuidesError={false}
      />,
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("ghost");
    expect(Array.from(select.options).map((o) => o.value)).toContain("ghost");
  });

  it("emits onChange with the picked id (or undefined when cleared)", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value="ap"
        onChange={onChange}
        styleGuides={styleGuides}
        styleGuidesLoading={false}
        styleGuidesError={false}
      />,
    );
    const select = getByRole("combobox");
    fireEvent.change(select, { target: { value: "chicago" } });
    expect(onChange).toHaveBeenLastCalledWith("chicago");
    fireEvent.change(select, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("flags an error state when prefetchedError is true", () => {
    const { getByText, getByRole } = render(
      <AgentConfigField
        configKey="style_guide_id"
        value=""
        onChange={vi.fn()}
        styleGuides={styleGuides}
        styleGuidesLoading={false}
        styleGuidesError
      />,
    );
    expect(getByText(/failed to load style guides/i)).toBeInTheDocument();
    // isInvalid bubbles to the FormControl wrapper; the select itself is still
    // selectable, but Sonar coverage wants the helpText/error branch hit.
    expect(getByRole("combobox")).toBeInTheDocument();
  });
});
