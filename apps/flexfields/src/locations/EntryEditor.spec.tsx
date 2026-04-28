import React from "react";
import EntryEditor from "./EntryEditor";
import { render } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock("@contentful/default-field-editors", () => ({
  getDefaultWidgetId: () => "singleLine",
}));

vi.mock("../components/DefaultField", () => ({
  default: () => <div data-test-id="default-field" />,
}));

describe("Entry Editor component", () => {
  it("EntryEditor form exists", () => {
    const { container } = render(<EntryEditor />);

    expect(container.querySelector("form")).toBeInTheDocument();
  });
});
