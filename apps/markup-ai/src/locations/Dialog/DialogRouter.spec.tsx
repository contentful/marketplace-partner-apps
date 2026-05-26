import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import DialogRouter from "./DialogRouter";
import type { DialogAppSDK } from "@contentful/app-sdk";

vi.mock("./FieldCheckDialog", () => ({
  __esModule: true,
  default: () => <div data-testid="field-check-dialog">Field Check Dialog</div>,
}));
vi.mock("./SignInDialog", () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-dialog">Sign In Dialog</div>,
}));

let mockUseSDKReturn: Partial<DialogAppSDK> = {};
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => mockUseSDKReturn,
}));

beforeEach(() => {
  mockUseSDKReturn = {};
});

describe("DialogRouter", () => {
  it("renders SignInDialog when signIn param is present", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { signIn: true } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByTestId("sign-in-dialog")).toBeInTheDocument();
  });

  it("renders FieldCheckDialog when fieldCheck param is present", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { fieldCheck: true } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByTestId("field-check-dialog")).toBeInTheDocument();
  });

  it("renders fallback for unknown dialog type", () => {
    mockUseSDKReturn = {
      parameters: { invocation: { foo: "bar" } },
    } as unknown as Partial<DialogAppSDK>;
    render(<DialogRouter />);
    expect(screen.getByText(/unknown dialog type/i)).toBeInTheDocument();
  });
});
