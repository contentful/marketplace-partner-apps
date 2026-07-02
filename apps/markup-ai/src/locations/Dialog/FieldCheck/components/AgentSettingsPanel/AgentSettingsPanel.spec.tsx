import { describe, expect, it, vi } from "vitest";
import { render } from "../../../../../../test/utils/testUtils";
import { AgentSettingsPanel } from "./AgentSettingsPanel";
import { STYLE_AGENT_DISABLED_MESSAGE } from "../../../../../agents/agentAvailability";

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof AgentSettingsPanel>> = {},
): React.ComponentProps<typeof AgentSettingsPanel> {
  return {
    onBack: vi.fn(),
    selectedAgentIds: ["style_agent"],
    toggleAgent: vi.fn(),
    agentConfig: {},
    onAgentConfigKeyChange: vi.fn(),
    apiKey: "test-token",
    styleGuides: [],
    styleGuidesLoading: false,
    styleGuidesError: false,
    ...overrides,
  };
}

describe("AgentSettingsPanel", () => {
  it("renders the style_agent toggle as enabled when no unavailability is reported", () => {
    const { getByLabelText } = render(<AgentSettingsPanel {...defaultProps()} />);
    const toggle = getByLabelText("Enable Style Agent") as HTMLInputElement;
    expect(toggle.disabled).toBe(false);
  });

  it("disables the style_agent toggle and surfaces the reason when unavailable", () => {
    const unavailableAgents = new Map([["style_agent", { reason: STYLE_AGENT_DISABLED_MESSAGE }]]);
    const { getByLabelText, getAllByText } = render(
      <AgentSettingsPanel {...defaultProps({ unavailableAgents })} />,
    );
    const toggle = getByLabelText("Enable Style Agent") as HTMLInputElement;
    expect(toggle.disabled).toBe(true);
    // Reason copy renders inline below the agent name; the f36 Tooltip
    // wrapping the Switch is portal-rendered only on hover, so we don't
    // assert on it here.
    expect(getAllByText(STYLE_AGENT_DISABLED_MESSAGE).length).toBeGreaterThan(0);
  });

  it("keeps the agent visible when unavailable so users can still see config", () => {
    const unavailableAgents = new Map([["style_agent", { reason: STYLE_AGENT_DISABLED_MESSAGE }]]);
    const { getByText } = render(<AgentSettingsPanel {...defaultProps({ unavailableAgents })} />);
    expect(getByText("Style Agent")).toBeInTheDocument();
  });
});
