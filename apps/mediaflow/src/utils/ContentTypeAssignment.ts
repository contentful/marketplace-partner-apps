import type { AppState } from '@contentful/app-sdk';
import type { InstallationParameters } from '../types';

/** Where the app is used in one content type: the JSON object fields it edits, and whether the sidebar button is shown */
export interface ContentTypeAssignment {
  fields: string[];
  sidebar: boolean;
}

/** The app's assignments, keyed by content type id */
export type Assignments = Record<string, ContentTypeAssignment>;

/** The parts of a content type the configuration screen needs */
export interface ContentTypeSummary {
  id: string;
  name: string;
  jsonFields: Array<{ id: string; name: string }>;
}

/** The content type shape returned by the CMA, reduced to what is read here */
interface ContentTypeLike {
  sys: { id: string };
  name: string;
  fields: Array<{ id: string; name: string; type: string; omitted?: boolean; disabled?: boolean }>;
}

/** Sidebar position used when the app is added to a content type's sidebar for the first time */
export const DEFAULT_SIDEBAR_POSITION = 1;

/**
 * Lists the content types that have at least one JSON object field, the only field type the app can edit, sorted by name.
 *
 * @param contentTypes - Content types as returned by the CMA
 * @returns The content types with their JSON object fields
 */
export function summarizeContentTypes(contentTypes: ContentTypeLike[]): ContentTypeSummary[] {
  return contentTypes
    .map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      jsonFields: contentType.fields
        .filter((field) => field.type === 'Object')
        .map((field) => ({ id: field.id, name: field.name })),
    }))
    .filter((contentType) => contentType.jsonFields.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Reads the current assignments from the app state, so reconfiguring the app keeps what is already set up.
 *
 * @param state - The result of sdk.app.getCurrentState(), null before the app is installed
 * @returns The assignments per content type
 */
export function assignmentsFromState(state: AppState | null | undefined): Assignments {
  const assignments: Assignments = Object.create(null) as Assignments;
  for (const [contentTypeId, item] of Object.entries(state?.EditorInterface ?? {})) {
    const fields = (item.controls ?? []).map((control) => control.fieldId);
    const sidebar = item.sidebar !== undefined;
    if (fields.length > 0 || sidebar || item.editors !== undefined) {
      assignments[contentTypeId] = { fields, sidebar };
    }
  }
  return assignments;
}

/**
 * Builds the target state returned from onConfigure. Content types without fields, sidebar or an existing entry editor assignment are left out,
 * which removes the app from them.
 * Settings already in the current state (sidebar position, control settings, entry editor assignment) are kept.
 *
 * @param assignments - The assignments chosen on the configuration screen
 * @param currentState - The current app state, null before the app is installed
 * @returns The target state for sdk.app.onConfigure
 */
export function buildTargetState(assignments: Assignments, currentState: AppState | null | undefined): AppState {
  const editorInterface: AppState['EditorInterface'] = Object.create(null) as AppState['EditorInterface'];
  for (const [contentTypeId, assignment] of Object.entries(assignments)) {
    const current = currentState?.EditorInterface?.[contentTypeId];
    if (assignment.fields.length === 0 && !assignment.sidebar && current?.editors === undefined) {
      continue;
    }
    const item: AppState['EditorInterface'][string] = {};
    if (assignment.fields.length > 0) {
      item.controls = assignment.fields.map((fieldId) => {
        const existing = current?.controls?.find((control) => control.fieldId === fieldId);
        return existing ? { ...existing } : { fieldId };
      });
    }
    if (assignment.sidebar) {
      item.sidebar = current?.sidebar ?? { position: DEFAULT_SIDEBAR_POSITION };
    }
    if (current?.editors !== undefined) {
      item.editors = current.editors;
    }
    editorInterface[contentTypeId] = item;
  }
  return { EditorInterface: editorInterface };
}

/**
 * Returns a copy of the assignments with one field or the sidebar turned on or off.
 *
 * @param assignments - The current assignments
 * @param contentTypeId - The content type to change
 * @param change - The field id to toggle, or "sidebar"
 * @param enabled - Whether it should be on
 * @returns The new assignments
 */
export function toggleAssignment(assignments: Assignments, contentTypeId: string, change: { fieldId: string } | 'sidebar', enabled: boolean): Assignments {
  const current = Object.hasOwn(assignments, contentTypeId) ? assignments[contentTypeId] : { fields: [], sidebar: false };
  let next: ContentTypeAssignment;
  if (change === 'sidebar') {
    next = { ...current, sidebar: enabled };
  } else {
    const others = current.fields.filter((fieldId) => fieldId !== change.fieldId);
    next = { ...current, fields: enabled ? [...others, change.fieldId] : others };
  }
  const result: Assignments = Object.assign(Object.create(null) as Assignments, assignments);
  result[contentTypeId] = next;
  return result;
}

/** The credentials the app needs, with the labels shown on the configuration screen */
export const REQUIRED_CREDENTIALS = [
  { key: 'clientId', label: 'Client ID' },
  { key: 'clientSecret', label: 'Client secret' },
  { key: 'refreshToken', label: 'Refresh token' },
] as const;

/**
 * Lists the credentials that are empty. The app cannot authenticate against Mediaflow without all three.
 *
 * @param parameters - The installation parameters
 * @returns The labels of the missing credentials, empty when all are set
 */
export function missingCredentials(parameters: InstallationParameters): string[] {
  return REQUIRED_CREDENTIALS
    .filter(({ key }) => !parameters[key]?.trim())
    .map(({ label }) => label);
}
