import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../../../test/utils/testUtils";
import { SuggestionsCard, SuggestionsCardApplyAllCheckbox } from "./SuggestionsCard";

describe("SuggestionsCard", () => {
  it("uses the singular 'Suggestion:' label for one item", () => {
    const { getByText } = render(
      <SuggestionsCard items={[{ text: "fixed", onApply: vi.fn() }]} canInteract />,
    );
    expect(getByText("Suggestion:")).toBeInTheDocument();
  });

  it("uses the plural 'Suggestions:' label when there are 2+ items", () => {
    const items = [
      { text: "alpha", onApply: vi.fn() },
      { text: "beta", onApply: vi.fn() },
    ];
    const { getByText } = render(<SuggestionsCard items={items} canInteract />);
    expect(getByText("Suggestions:")).toBeInTheDocument();
  });

  it("invokes onApply when a suggestion is clicked", () => {
    const onApply = vi.fn();
    const { getByText } = render(
      <SuggestionsCard items={[{ text: "fixed", onApply }]} canInteract />,
    );
    fireEvent.click(getByText("fixed"));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("disables suggestion buttons when canInteract is false", () => {
    const onApply = vi.fn();
    const { getByText } = render(
      <SuggestionsCard items={[{ text: "fixed", onApply }]} canInteract={false} />,
    );
    fireEvent.click(getByText("fixed"));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("renders a placeholder dash when an item has empty text", () => {
    const { getByText } = render(
      <SuggestionsCard items={[{ text: "", onApply: vi.fn() }]} canInteract />,
    );
    expect(getByText("—")).toBeInTheDocument();
  });

  it("hides items past the 3-item limit and shows 'Show more (+N)'", () => {
    const items = ["a", "b", "c", "d", "e"].map((t) => ({ text: t, onApply: vi.fn() }));
    const { getByText, queryByText } = render(<SuggestionsCard items={items} canInteract />);
    expect(getByText("a")).toBeInTheDocument();
    expect(queryByText("d")).not.toBeInTheDocument();
    expect(queryByText("e")).not.toBeInTheDocument();
    expect(getByText(/show more \(\+2\)/i)).toBeInTheDocument();
  });

  it("expands all items and switches to 'Show less' when overflow toggle is clicked", () => {
    const items = ["a", "b", "c", "d", "e"].map((t) => ({ text: t, onApply: vi.fn() }));
    const { getByText, queryByText } = render(<SuggestionsCard items={items} canInteract />);
    fireEvent.click(getByText(/show more \(\+2\)/i));
    expect(getByText("d")).toBeInTheDocument();
    expect(getByText("e")).toBeInTheDocument();
    expect(getByText(/show less/i)).toBeInTheDocument();
    expect(queryByText(/show more/i)).not.toBeInTheDocument();
  });

  it("does not render the overflow toggle for exactly 3 items", () => {
    const items = ["a", "b", "c"].map((t) => ({ text: t, onApply: vi.fn() }));
    const { queryByText } = render(<SuggestionsCard items={items} canInteract />);
    expect(queryByText(/show more/i)).not.toBeInTheDocument();
    expect(queryByText(/show less/i)).not.toBeInTheDocument();
  });
});

describe("SuggestionsCardApplyAllCheckbox", () => {
  it("renders nothing when peerCount <= 1", () => {
    const { container } = render(
      <SuggestionsCardApplyAllCheckbox
        canInteract
        control={{ peerCount: 1, checked: false, onCheckedChange: vi.fn() }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Apply to all N occurrences' when peerCount >= 2", () => {
    const { getByText } = render(
      <SuggestionsCardApplyAllCheckbox
        canInteract
        control={{ peerCount: 4, checked: false, onCheckedChange: vi.fn() }}
      />,
    );
    expect(getByText(/apply to all 4 occurrences/i)).toBeInTheDocument();
  });

  it("invokes onCheckedChange with the new state when toggled", () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <SuggestionsCardApplyAllCheckbox
        canInteract
        control={{ peerCount: 3, checked: false, onCheckedChange }}
      />,
    );
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(input);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("respects canInteract=false", () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <SuggestionsCardApplyAllCheckbox
        canInteract={false}
        control={{ peerCount: 3, checked: false, onCheckedChange }}
      />,
    );
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
