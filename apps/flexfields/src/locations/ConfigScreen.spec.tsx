import React from "react";
import ConfigScreen from "./ConfigScreen";
import { render } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe("Config Screen component", () => {
  it("App config screen exists", async () => {
    const { getByText } = render(<ConfigScreen />);

    expect(getByText("FlexFields App Config")).toBeInTheDocument();
  });
});
