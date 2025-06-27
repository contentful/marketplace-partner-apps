import ConfigScreen from "./ConfigScreen";
import { render } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";
import { vi, describe, it, expect } from "vitest";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe("Config Screen component", () => {
  it("Component text exists", async () => {
    const { getByText } = render(<ConfigScreen />);

    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText("Get started")).toBeTruthy();
  });
});
