import { ConfigAppSDK } from '@contentful/app-sdk';
import { EditorInterfaceProps } from 'contentful-management';

type Widget = {
  widgetNamespace: string;
  widgetId: string;
  disabled?: boolean;
  [k: string]: unknown;
};

const DEFAULT_SIDEBAR: ReadonlyArray<Widget> = [
  { widgetNamespace: 'sidebar-builtin', widgetId: 'publication-widget' },
  { widgetNamespace: 'sidebar-builtin', widgetId: 'content-preview-widget' },
  { widgetNamespace: 'sidebar-builtin', widgetId: 'incoming-links-widget' },
  { widgetNamespace: 'sidebar-builtin', widgetId: 'translation-widget' },
  { widgetNamespace: 'sidebar-builtin', widgetId: 'versions-widget' },
  { widgetNamespace: 'sidebar-builtin', widgetId: 'users-widget' },
] as const;

const DISABLED_DEFAULT_EDITOR: Widget = {
  widgetNamespace: 'editor-builtin',
  widgetId: 'default-editor',
  disabled: true,
};

const asArray = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v.slice() : []);

const uniqByKey = <T extends { widgetNamespace?: string; widgetId?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = `${String(it.widgetNamespace)}::${String(it.widgetId)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
};

export async function ensureAppInSidebarAndEditor(sdk: ConfigAppSDK, contentTypeId: string): Promise<void> {
  const appId = sdk.ids.app;

  const appDef = await sdk.cma.appDefinition.get({ appDefinitionId: appId });
  const locations = asArray(appDef.locations as any[]).map((l: any) => l?.location);
  if (!locations.includes('entry-editor') || !locations.includes('entry-sidebar')) {
    throw new Error("App definition must declare 'entry-editor' and 'entry-sidebar'.");
  }

  const spaceId = sdk.ids.space;
  const environmentId = (sdk.ids as any).environmentAlias ?? sdk.ids.environment;

  const getEI = async (): Promise<EditorInterfaceProps> =>
    sdk.cma.editorInterface.get({ spaceId, environmentId, contentTypeId });

  const buildPayload = (ei: EditorInterfaceProps): EditorInterfaceProps => {
    // Editors: place l'app en premier, force disabled=false, et désactive l'éditeur par défaut
    const existingEditors = asArray(ei.editors as Widget[]);
    const editorsSansAppEtDefault = existingEditors.filter(
      (w) =>
        !(
          (w.widgetNamespace === 'app' && w.widgetId === appId) ||
          (w.widgetNamespace === 'editor-builtin' && w.widgetId === 'default-editor')
        )
    );

    const editors = uniqByKey<Widget>([
      { widgetNamespace: 'app', widgetId: appId, disabled: false },
      DISABLED_DEFAULT_EDITOR,
      ...editorsSansAppEtDefault,
    ]).map((w) => (w.widgetNamespace === 'app' && w.widgetId === appId ? { ...w, disabled: false } : w));

    // Sidebar: si vide, partir des defaults, puis s'assurer que l'app est présente et activée
    const baseSidebar = asArray(ei.sidebar as Widget[]);
    const sidebarStart = baseSidebar.length ? baseSidebar : (DEFAULT_SIDEBAR as unknown as Widget[]);

    const sidebar = uniqByKey<Widget>([
      // App en première position
      { widgetNamespace: 'app', widgetId: appId, disabled: false },
      // Puis le reste de la sidebar en retirant toute occurrence de l'app
      ...sidebarStart.filter((w) => !(w.widgetNamespace === 'app' && w.widgetId === appId)),
    ]).map((w) => (w.widgetNamespace === 'app' && w.widgetId === appId ? { ...w, disabled: false } : w));

    return {
      ...ei,
      editors: editors as any,
      sidebar: sidebar as any,
    };
  };

  let ei = await getEI();
  let payload = buildPayload(ei);

  try {
    await sdk.cma.editorInterface.update({ spaceId, environmentId, contentTypeId }, payload);
  } catch (e: any) {
    const is409 =
      e?.status === 409 ||
      e?.name === 'VersionMismatch' ||
      String(e?.message ?? '')
        .toLowerCase()
        .includes('version');
    if (!is409) throw e;

    // Re-fetch puis réappliquer avec la sys à jour
    ei = await getEI();
    payload = buildPayload(ei);
    await sdk.cma.editorInterface.update({ spaceId, environmentId, contentTypeId }, payload);
  }
}
