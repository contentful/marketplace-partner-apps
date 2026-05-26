/** Category IDs aligned with Cortex. */
export type AgentCategoryID = "compliance" | "brand" | "geo" | "integrity";

export interface AgentCategory {
  id: AgentCategoryID;
  name: string;
  description?: string;
}

/** Agent id is a string to support any Cortex agent; known ids are typed where needed. */
export type AgentID = string;

/**
 * Icon keys are semantic names; the UI resolves them to Forma 36 icon components
 * in a single mapping layer. Keeping agents decoupled from a concrete icon lib
 * lets us swap icons without rewriting the catalog.
 */
export type AgentIconKey =
  | "bot"
  | "spell-check"
  | "palette"
  | "shield-check"
  | "cloud"
  | "book"
  | "file-check"
  | "search";

export interface Agent {
  id: AgentID;
  name: string;
  iconKey: AgentIconKey;
  description?: string | null;
  /** Keys this agent supports in agent config (e.g. target_id for style_agent). */
  configurationKeys: string[];
  category: AgentCategoryID;
}

export const CATEGORIES: Record<AgentCategoryID, AgentCategory> = {
  geo: {
    id: "geo",
    name: "AI Visibility",
    description: "Tune how your content surfaces in AI answers and search-style experiences.",
  },
  brand: {
    id: "brand",
    name: "Brand",
    description: "Align voice, style, and terminology with your brand.",
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    description: "Surface claims, disclosures, and sensitivity risks before publish.",
  },
  integrity: {
    id: "integrity",
    name: "Content Integrity",
    description: "Improve clarity, structure, and factual quality.",
  },
};

export const DEFAULT_ICON: AgentIconKey = "bot";
export const DEFAULT_CATEGORY: AgentCategoryID = "brand";

export const AGENT_ICON_MAP: Record<string, AgentIconKey> = {
  style_agent: "spell-check",
  terminology: "book",
  focus_agent: "cloud",
  ai_voice_detector: "bot",
  pii_detector: "shield-check",
  geo_optimizer: "search",
};

export const AGENT_CATEGORY_MAP: Record<string, AgentCategoryID> = {
  style_agent: "brand",
  terminology: "brand",
  focus_agent: "integrity",
  ai_voice_detector: "integrity",
  pii_detector: "compliance",
  geo_optimizer: "geo",
};

/** Per-agent configuration keys. Agents not listed here have no configuration. */
const AGENT_CONFIG_KEYS: Record<string, string[]> = {
  style_agent: ["target_id"],
  terminology: ["domain_ids"],
};

function buildAgent(entry: { id: string; name?: string }): Agent {
  const slugName = entry.id
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "ai" || lower === "seo" || lower === "api") return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
  return {
    id: entry.id,
    name: entry.name ?? slugName,
    iconKey: AGENT_ICON_MAP[entry.id] ?? DEFAULT_ICON,
    configurationKeys: AGENT_CONFIG_KEYS[entry.id] ?? [],
    category: AGENT_CATEGORY_MAP[entry.id] ?? DEFAULT_CATEGORY,
    description: undefined,
  };
}

/**
 * When VITE_AGENTIC_LIST_ALL_AGENTS=true, expand catalog to every known id so UI
 * can exercise multi-agent layouts during development. In production the list is
 * a small curated set.
 */
export function shouldListAllAgents(
  listAllAgentsEnv: unknown = import.meta.env.VITE_AGENTIC_LIST_ALL_AGENTS,
): boolean {
  if (typeof listAllAgentsEnv !== "string") return false;
  return ["true", "1", "yes", "on"].includes(listAllAgentsEnv.trim().toLowerCase());
}

export function getAgentEntries(listAllAgents = shouldListAllAgents()): { id: string }[] {
  const defaultAgents: { id: string }[] = [{ id: "style_agent" }];
  if (!listAllAgents) return defaultAgents;

  const allIds = Array.from(
    new Set<string>([...Object.keys(AGENT_ICON_MAP), ...Object.keys(AGENT_CATEGORY_MAP)]),
  ).sort((a, b) => a.localeCompare(b));

  return allIds.map((id) => ({ id }));
}

export function getAgents(listAllAgents = shouldListAllAgents()): Agent[] {
  return getAgentEntries(listAllAgents).map(buildAgent);
}

export const AGENTS: Agent[] = getAgents();

export interface AgentConfigKeyMeta {
  label: string;
  placeholder: string;
  inputType: "csv" | "text" | "domain_select" | "target_select";
  required?: boolean;
}

export const AGENT_CONFIG_KEY_META: Partial<Record<string, AgentConfigKeyMeta>> = {
  domain_ids: {
    label: "Terminology Domains",
    placeholder: "Select domains…",
    inputType: "domain_select",
  },
  target_id: {
    label: "Style Guide",
    placeholder: "Select a style guide…",
    inputType: "target_select",
  },
};

export function getAgentByID(agentId: string): Agent | null {
  return AGENTS.find((a) => a.id === agentId) ?? null;
}

export function getFallbackAgent(agentId: string): Agent {
  return buildAgent({ id: agentId, name: toTitleCase(agentId) });
}

export function getAgentIconKey(agentId: string): AgentIconKey {
  return AGENT_ICON_MAP[agentId] ?? DEFAULT_ICON;
}

const KNOWN_ACRONYMS: ReadonlySet<string> = new Set([
  "ai",
  "seo",
  "url",
  "api",
  "html",
  "css",
  "id",
  "ui",
  "ux",
]);

export function toTitleCase(slug: string): string {
  return slug
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      if (KNOWN_ACRONYMS.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
