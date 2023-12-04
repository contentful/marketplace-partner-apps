import React from "react";
import EntryEditor from "./EntryEditor";
import { render } from "@testing-library/react";
import { mockCma, mockSdk } from "../../test/mocks";

jest.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe("Entry Editor component", () => {
  it("EntryEditor form exists", () => {
    const { container } = render(<EntryEditor />);

    expect(container.querySelector("form")).toBeInTheDocument();
  });
});
