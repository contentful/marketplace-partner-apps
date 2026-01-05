import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import DialogRouter from "./DialogRouter";
import type { DialogAppSDK } from "@contentful/app-sdk";

// Mock the dialog components
vi.mock("../../components/FieldCheckCard/MoreDetailsDialog", () => ({
  MoreDetailsDialog: () => <div data-testid="more-details-dialog">More Details Dialog</div>,
}));
vi.mock("./Dialog", () => ({
  __esModule: true,
  default: () => <div data-testid="rewrite-dialog">Rewrite Dialog</div>,
}));

let mockUseSDKReturn: Partial<DialogAppSDK> = {};
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockUseSDKReturn,
}));

beforeEach(() => {
  mockUseSDKReturn = {};
});

describe("DialogRouter", () => {
  it("renders Rewrite Dialog when startRewrite param is present", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { startRewrite: true } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByTestId("rewrite-dialog")).toBeInTheDocument();
  });

  it("renders MoreDetailsDialog when checkResponse param is present", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { checkResponse: { scores: { quality: { score: 90 } } } } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByTestId("more-details-dialog")).toBeInTheDocument();
  });

  it("renders fallback for unknown dialog type", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { foo: "bar" } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByText(/unknown dialog type/i)).toBeInTheDocument();
  });
});
