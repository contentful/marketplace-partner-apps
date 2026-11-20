/**
 * contentfulSetupTypes.ts
 *
 * Shared Contentful Management API types and helpers used by setup scripts.
 * Import with:
 *   import { AppDef, CmaOrg, ... } from './_shared/contentfulSetupTypes.js';
 */

const LEGACY_APP_IDS = ["2Ydxql3xmmDPyLopxWS4EY"];

/** Minimal type for a Contentful App Definition object returned by the CMA. */
export type AppDef = {
  src?: string;
  locations?: Array<{ location: string }>;
  parameters?: Record<string, unknown>;
  update(): Promise<AppDef>;
  sys: { id: string };
};

/** Minimal type for a Contentful Organization object returned by the CMA. */
export type CmaOrg = {
  name?: string;
  sys: { id: string };
  getAppDefinition?(id: string): Promise<AppDef>;
  createAppDefinition?(params: Record<string, unknown>): Promise<AppDef>;
  getAppDefinitions?(): Promise<{ items: AppDef[] }>;
};

/** Minimal type for the Contentful Management API client. */
export type CmaClient = {
  getOrganization?(id: string): Promise<CmaOrg>;
  getOrganizations?(): Promise<{ items: CmaOrg[] }>;
  getAppDefinition?(id: string): Promise<AppDef>;
  createAppDefinition?(params: Record<string, unknown>): Promise<AppDef>;
};

/** Minimal type for a Contentful Space object returned by the CMA. */
export type CmaSpace = {
  sys: { organization?: { sys: { id: string } }; id: string };
  getAppDefinition?(id: string): Promise<AppDef>;
  createAppDefinition?(params: Record<string, unknown>): Promise<AppDef>;
  getAppDefinitions?(): Promise<{ items: AppDef[] }>;
};

/** Minimal type for an entry sidebar widget in an EditorInterface. */
export type SidebarWidget = {
  widgetNamespace?: string;
  widgetId?: string;
  disabled?: boolean;
};

/** Minimal type for a Contentful EditorInterface object. */
export type EditorInterface = {
  sidebar?: SidebarWidget[];
  update(): Promise<void>;
};

/**
 * Normalize the sidebar widget list for a content type:
 * - Remove stale/legacy app widgets
 * - Ensure the current app widget is first
 * - Preserve all other widgets
 */
export function normalizeSidebarApps(
  sidebar: SidebarWidget[],
  currentAppId: string,
): SidebarWidget[] {
  const staleIds = new Set(
    LEGACY_APP_IDS.filter((id) => id && id !== currentAppId),
  );
  const filtered = sidebar.filter(
    (widget) =>
      widget?.widgetNamespace !== "app" || !staleIds.has(widget.widgetId ?? ""),
  );
  const currentWidget = filtered.find(
    (widget) =>
      widget?.widgetNamespace === "app" && widget.widgetId === currentAppId,
  ) || {
    widgetNamespace: "app",
    widgetId: currentAppId,
    disabled: false,
  };
  const rest = filtered.filter(
    (widget) =>
      widget?.widgetNamespace !== "app" || widget.widgetId !== currentAppId,
  );

  return [currentWidget, ...rest];
}

/**
 * Returns the standard App Definition parameter schema used by all setup scripts.
 * Defines the `appToken` installation parameter required by the sidebar app.
 */
export function getAppDefinitionParameters() {
  return {
    installation: [
      {
        id: "appToken",
        name: "App Token",
        description:
          "Shared secret used by the sidebar app to authenticate API calls.",
        type: "Secret" as const,
        required: true,
      },
    ],
    instance: [],
  };
}
