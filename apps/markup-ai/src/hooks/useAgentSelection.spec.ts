import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAgentSelection } from "./useAgentSelection";
import { DEFAULT_SELECTED_AGENT_IDS } from "../agents/agenticConfig";

describe("useAgentSelection", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("initializes with DEFAULT_SELECTED_AGENT_IDS when no session data", () => {
    const { result } = renderHook(() => useAgentSelection());
    expect(result.current.selectedAgentIds).toEqual(DEFAULT_SELECTED_AGENT_IDS);
  });

  it("toggles an agent off then on", () => {
    const { result } = renderHook(() => useAgentSelection());

    act(() => {
      result.current.toggleAgent("style_agent");
    });
    expect(result.current.isSelected("style_agent")).toBe(false);

    act(() => {
      result.current.toggleAgent("style_agent");
    });
    expect(result.current.isSelected("style_agent")).toBe(true);
  });

  it("persists selection to sessionStorage", () => {
    const { result } = renderHook(() => useAgentSelection());

    act(() => {
      result.current.toggleAgent("style_agent");
    });

    const stored = sessionStorage.getItem("markupai.agentSelection");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? "[]")).toEqual([]);
  });

  it("falls back to defaults when stored selection is all unrunnable", () => {
    sessionStorage.setItem("markupai.agentSelection", JSON.stringify(["nonexistent_agent"]));
    const { result } = renderHook(() => useAgentSelection());
    expect(result.current.selectedAgentIds).toEqual(DEFAULT_SELECTED_AGENT_IDS);
  });
});
