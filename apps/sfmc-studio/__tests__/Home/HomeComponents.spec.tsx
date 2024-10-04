import React from "react";
import { render, screen } from "@testing-library/react";
import EntryEditor from "../../src/app/components/Locations/EntryEditor";
import Dialog from "../../src/app/components/Locations/Dialog";
import Sidebar from "../../src/app/components/Locations/Sidebar";
import Page from "../../src/app/components/Locations/Page";
import HomeComponent from "../../src/app/components/Locations/Home";
import { useSDK } from "@contentful/react-apps-toolkit";

// Mocking the components
jest.mock("../../src/app/components/Locations/ConfigScreen", () => () => (
  <div>ConfigScreen Component</div>
));
jest.mock("../../src/app/components/Locations/Field", () => () => (
  <div>Field Component</div>
));
jest.mock("../../src/app/components/Locations/EntryEditor", () => () => (
  <div>EntryEditor Component</div>
));
jest.mock("../../src/app/components/Locations/Dialog", () => () => (
  <div>Dialog Component</div>
));
jest.mock("../../src/app/components/Locations/Sidebar", () => () => (
  <div>Sidebar Component</div>
));
jest.mock("../../src/app/components/Locations/Page", () => () => (
  <div>Page Component</div>
));
jest.mock("../../src/app/components/Locations/Home", () => () => (
  <div>Home Component</div>
));

// Mocking useSDK hook
jest.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: jest.fn(),
}));

describe("HomeComponent", () => {
  it("renders Field component when location is LOCATION_ENTRY_FIELD", () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === "LOCATION_ENTRY_FIELD",
      },
    });
    render(<HomeComponent />);
    // Using getByText to find the Field Component
    expect(
      screen.getByText((content) => content.includes("Home Component"))
    ).toBeInTheDocument();
  });

  it("renders EntryEditor component when location is LOCATION_ENTRY_EDITOR", () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === "LOCATION_ENTRY_EDITOR",
      },
    });
    render(<EntryEditor />);

    expect(
      screen.getByText((content) => content.includes("EntryEditor Component"))
    ).toBeInTheDocument();
  });

  it("renders Dialog component when location is LOCATION_DIALOG", () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === "LOCATION_DIALOG",
      },
    });
    render(<Dialog />);

    expect(
      screen.getByText((content) => content.includes("Dialog Component"))
    ).toBeInTheDocument();
  });

  it("renders Sidebar component when location is LOCATION_ENTRY_SIDEBAR", () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === "LOCATION_ENTRY_SIDEBAR",
      },
    });
    render(<Sidebar />);

    expect(
      screen.getByText((content) => content.includes("Sidebar Component"))
    ).toBeInTheDocument();
  });
  it("renders Page component when location is LOCATION_ENTRY_SIDEBAR", () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === "LOCATION_ENTRY_SIDEBAR",
      },
    });
    render(<Page />);
  });
});
