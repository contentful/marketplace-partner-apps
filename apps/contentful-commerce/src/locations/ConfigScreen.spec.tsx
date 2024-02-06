import React from "react";
import ConfigScreen from "./ConfigScreen";
import { render } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";

jest.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe("Config Screen component", () => {
  it("renders correctly", () => {
    const { container } = render(<ConfigScreen />);
    const dynamicAttributeElements =
      container.querySelectorAll("[id],[for],[class]");

    for (const element of Array.from(dynamicAttributeElements)) {
      element.removeAttribute("id");
      element.removeAttribute("for");
      element.removeAttribute("class");
    }

    expect(container.firstChild).toMatchSnapshot();
  });
});
