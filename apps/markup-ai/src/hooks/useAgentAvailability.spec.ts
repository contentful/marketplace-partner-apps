import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAgentAvailability } from "./useAgentAvailability";
import { STYLE_AGENT_DISABLED_MESSAGE } from "../agents/agentAvailability";
import { StyleAgentMode } from "../api-client/types.gen";

const mockUseAccountConfig = vi.fn();
vi.mock("./useAccountConfig", () => ({
  useAccountConfig: (): unknown => mockUseAccountConfig() as unknown,
}));

describe("useAgentAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty unavailability map while loading (fail-open)", () => {
    mockUseAccountConfig.mockReturnValue({ config: null, isLoading: true, isError: false });
    const { result } = renderHook(() => useAgentAvailability());
    expect(result.current.unavailable.size).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("returns an empty unavailability map on error (fail-open)", () => {
    mockUseAccountConfig.mockReturnValue({ config: null, isLoading: false, isError: true });
    const { result } = renderHook(() => useAgentAvailability());
    expect(result.current.unavailable.size).toBe(0);
    expect(result.current.isError).toBe(true);
  });

  it("flags style_agent unavailable when org config has it disabled", () => {
    mockUseAccountConfig.mockReturnValue({
      config: {
        is_acrolinx_classic: false,
        style_agent: StyleAgentMode.DISABLED,
        style_agent_numeric_scoring: false,
      },
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useAgentAvailability());
    expect(result.current.unavailable.get("style_agent")?.reason).toBe(
      STYLE_AGENT_DISABLED_MESSAGE,
    );
  });

  it("does not flag any agent when style_agent is enabled", () => {
    mockUseAccountConfig.mockReturnValue({
      config: {
        is_acrolinx_classic: false,
        style_agent: StyleAgentMode.ENABLED,
        style_agent_numeric_scoring: false,
      },
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useAgentAvailability());
    expect(result.current.unavailable.size).toBe(0);
  });
});
