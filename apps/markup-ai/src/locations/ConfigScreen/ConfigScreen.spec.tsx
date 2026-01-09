import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../../test/utils/testUtils";
import { act } from "react";
import ConfigScreen from "./ConfigScreen";
import { useSDK } from "@contentful/react-apps-toolkit";
import { mockSdk } from "../../../test/mocks/mockSdk";

vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

describe("ConfigScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as unknown as Mock).mockReturnValue(mockSdk);
    mockSdk.app.getCurrentState.mockResolvedValue({ some: "state" });
    mockSdk.app.onConfigure.mockReset();
  });

  it("calls setReady on mount", async () => {
    act(() => {
      render(<ConfigScreen />);
    });
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
    expect(screen.getByText("Markup AI App")).toBeInTheDocument();
  });

  it("shows SSO configuration message", async () => {
    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "No installation-time configuration is required. Users will sign in via SSO from the sidebar settings.",
      ),
    ).toBeInTheDocument();
  });

  it("registers onConfigure and returns empty parameters", async () => {
    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });
    // Wait for parameters to be set and onConfigure re-registered
    await waitFor(() => {
      expect(
        (mockSdk.app.onConfigure as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
      ).toBeGreaterThanOrEqual(1);
    });
    const calls = (
      mockSdk.app.onConfigure as unknown as { mock: { calls: Array<[() => Promise<unknown>]> } }
    ).mock.calls;
    const handler = calls.at(-1)?.[0];
    expect(handler).toBeDefined();
    const res = await handler?.();
    expect(mockSdk.app.getCurrentState).toHaveBeenCalled();
    // Returns empty parameters since no configuration is needed
    expect(res).toEqual({ parameters: {}, targetState: { some: "state" } });
  });
});
