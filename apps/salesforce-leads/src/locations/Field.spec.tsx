import { describe, it, expect, vi } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";

import Field from "./Field";
import { mockCma, mockSdk } from "../../test/mocks";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => vi.fn(),
}));

describe("Field component", () => {
  it("renders heading", () => {
    const { getByText } = render(<Field />);
    expect(getByText("Salesforce Form Fields")).toBeTruthy();
  });

  it("moves an available field into selected list", async () => {
    const { getByText, getByRole } = render(<Field />);

    const titleItem = getByText("Title");
    fireEvent.click(titleItem);

    const moveButton = getByRole("button", { name: "Move to selected" });
    fireEvent.click(moveButton);

    await waitFor(() => {
      expect(mockSdk.field.setValue.mock.calls.length).toBeGreaterThanOrEqual(
        2
      );
      expect(getByText("Title")).toBeTruthy();
    });
  });
});
