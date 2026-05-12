import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen } from "../test/utils/testUtils";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

// Mock the components App dynamically chooses
vi.mock("./locations/ConfigScreen/ConfigScreen", () => ({
  default: () => <div>ConfigScreen</div>,
}));
vi.mock("./locations/Dialog/DialogRouter", () => ({ default: () => <div>DialogRouter</div> }));
vi.mock("./locations/Field/Field", () => ({ default: () => <div>Field</div> }));

import { useSDK } from "@contentful/react-apps-toolkit";
import { locations } from "@contentful/app-sdk";
import App from "./App";

const makeSdk = (match: string) => ({
  location: {
    is: (loc: string) => loc === match,
  },
});

describe("App", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders ConfigScreen when in app config location", async () => {
    (useSDK as unknown as Mock).mockReturnValue(makeSdk(locations.LOCATION_APP_CONFIG));
    render(<App />);
    expect(await screen.findByText("ConfigScreen")).toBeInTheDocument();
  });

  it("renders nothing when in entry sidebar location (no longer registered)", () => {
    (useSDK as unknown as Mock).mockReturnValue(makeSdk(locations.LOCATION_ENTRY_SIDEBAR));
    const { container } = render(<App />);
    expect(container.firstChild).toBeNull();
  });

  it("renders DialogRouter when in dialog location", async () => {
    (useSDK as unknown as Mock).mockReturnValue(makeSdk(locations.LOCATION_DIALOG));
    render(<App />);
    expect(await screen.findByText("DialogRouter")).toBeInTheDocument();
  });

  it("renders Field when in entry field location", async () => {
    (useSDK as unknown as Mock).mockReturnValue(makeSdk(locations.LOCATION_ENTRY_FIELD));
    render(<App />);
    expect(await screen.findByText("Field")).toBeInTheDocument();
  });

  it("renders nothing when no location matches", () => {
    (useSDK as unknown as Mock).mockReturnValue(makeSdk("unknown"));
    const { container } = render(<App />);
    expect(container.firstChild).toBeNull();
  });
});
