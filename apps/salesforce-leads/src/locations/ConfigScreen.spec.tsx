import { describe, it, expect, vi } from "vitest";

import ConfigScreen from "./ConfigScreen";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => vi.fn(),
}));

describe("Config Screen component", () => {
  it("Component text exists", async () => {
    const { getByText } = render(<ConfigScreen />);

    await mockSdk.app.onConfigure.mock.calls[0][0]();

    const element = getByText("Salesforce Integration Configuration");
    expect(element).toBeTruthy();
  });

  it("updates organization id in onConfigure", async () => {
    const { getByPlaceholderText } = render(<ConfigScreen />);

    const input = getByPlaceholderText(
      "Enter your Salesforce Organization ID"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Org123" } });

    await waitFor(() => {
      expect(input.value).toBe("Org123");
    });

    const lastCallIndex = mockSdk.app.onConfigure.mock.calls.length - 1;
    const result = await mockSdk.app.onConfigure.mock.calls[lastCallIndex][0]();
    expect(result.parameters.organizationId).toBe("Org123");
  });
});
