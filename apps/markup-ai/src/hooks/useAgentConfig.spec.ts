import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAgentConfig } from "./useAgentConfig";

describe("useAgentConfig", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("initializes empty", () => {
    const { result } = renderHook(() => useAgentConfig());
    expect(result.current.agentConfig).toEqual({});
  });

  it("stores a per-agent config key", () => {
    const { result } = renderHook(() => useAgentConfig());

    act(() => {
      result.current.setAgentConfigKey("style_agent", "target_id", "ap");
    });

    expect(result.current.agentConfig.style_agent).toEqual({ target_id: "ap" });
  });

  it("flattens only the included agents' configs into a single request object", () => {
    const { result } = renderHook(() => useAgentConfig());

    act(() => {
      result.current.setAgentConfigKey("style_agent", "target_id", "ap");
      result.current.setAgentConfigKey("terminology", "domain_ids", ["engineering"]);
    });

    expect(result.current.flattenConfigForRequest(["style_agent"])).toEqual({ target_id: "ap" });
    expect(result.current.flattenConfigForRequest(["style_agent", "terminology"])).toEqual({
      target_id: "ap",
      domain_ids: ["engineering"],
    });
  });

  it("drops empty values during flatten", () => {
    const { result } = renderHook(() => useAgentConfig());

    act(() => {
      result.current.setAgentConfigKey("style_agent", "target_id", "");
      result.current.setAgentConfigKey("terminology", "domain_ids", []);
    });

    expect(result.current.flattenConfigForRequest(["style_agent", "terminology"])).toEqual({});
  });

  it("persists to sessionStorage", () => {
    const { result } = renderHook(() => useAgentConfig());

    act(() => {
      result.current.setAgentConfigKey("style_agent", "target_id", "ap");
    });

    const stored = sessionStorage.getItem("markupai.agentConfig");
    expect(JSON.parse(stored ?? "{}")).toEqual({ style_agent: { target_id: "ap" } });
  });
});
