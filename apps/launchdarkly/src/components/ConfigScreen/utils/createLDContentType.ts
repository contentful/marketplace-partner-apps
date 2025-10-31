import { LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE } from '../../../utils/constants';

/**
 * Creates or updates the LaunchDarkly Feature Flag content type and publishes it.
 * Non-destructive: if the content type exists, only missing fields are appended.
 */
export async function createOrUpdateLDContentType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cma: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ids: { spaceId: string; environmentId: string },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: { appId?: string }
) {
  const contentTypeId = LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE;

  const desired = {
    name: 'LaunchDarkly Feature Flag',
    description: 'Create LaunchDarkly flags and map Contentful entries to variations.',
    displayField: 'name',
    fields: [
      { id: 'name', name: 'Name', type: 'Symbol', required: true, localized: false },
      { id: 'key', name: 'Key', type: 'Symbol', required: true, localized: false },
      { id: 'description', name: 'Description', type: 'Text', required: false, localized: false },
      { id: 'variations', name: 'Variations', type: 'Object', required: true, localized: false },
      {
        id: 'contentMapping',
        name: 'Content Mapping',
        type: 'Array',
        required: true,
        items: { type: 'Link', linkType: 'Entry' }
      },
      // Optional: editor tolerates if this field is absent
      // { id: 'mode', name: 'Mode', type: 'Symbol', required: false, localized: false }
    ]
  } as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ct: any;

  // Strategy: try create first (idempotent), then update if it already exists
  try {
    ct = await cma.contentType.createWithId({ contentTypeId }, desired);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (createErr: any) {
    const msg = (createErr?.message || '').toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isConflict = msg.includes('already exists') || createErr?.name === 'VersionMismatch' || createErr?.name === 'Conflict';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isNotFound = createErr?.name === 'NotFound' || msg.includes('not found');
    
    // If it already exists (or create not allowed), fetch and update
    ct = await cma.contentType.get({ contentTypeId });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingFields = ct.fields || [];
    const existingFieldMap = new Map(existingFields.map((f: any) => [f.id, f]));
    
    // Check if we need to update existing fields or add new ones
    const fieldsToAdd = desired.fields.filter((f) => !existingFieldMap.has(f.id));
    const fieldsToUpdate = desired.fields.filter((f) => {
      const existing = existingFieldMap.get(f.id);
      return existing && (existing as any).required !== f.required;
    });
    
    const hasChanges = fieldsToAdd.length > 0 || 
                      fieldsToUpdate.length > 0 || 
                      ct.displayField !== desired.displayField || 
                      ct.name !== desired.name;

    if (!hasChanges) {
      // No changes needed
    } else {
      // Update existing fields with new required status and add new fields
      const updatedFields = existingFields.map((field: any) => {
        const desiredField = desired.fields.find(f => f.id === field.id);
        if (desiredField && (field as any).required !== desiredField.required) {
          return { ...field, required: desiredField.required };
        }
        return field;
      });
      
      // Add any new fields
      const allFields = [...updatedFields, ...fieldsToAdd];
      
      // Plain client update requires passing latest version in payload
      const updated = {
        ...ct,
        name: desired.name,
        description: desired.description,
        displayField: desired.displayField,
        fields: allFields
      };

      ct = await cma.contentType.update({ contentTypeId }, updated);
    }
  }

  // Publish if not published or has unpublished changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentVersion = (ct as any)?.sys?.version ?? (ct as any)?.version;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPublished = (ct as any)?.sys?.publishedVersion ?? (ct as any)?.publishedVersion;
  if (!currentPublished || (currentVersion && currentPublished !== currentVersion)) {
    let version = currentVersion;
    if (!version) {
      const fresh = await cma.contentType.get({ contentTypeId });
      ct = fresh;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      version = (fresh as any)?.sys?.version ?? (fresh as any)?.version;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await cma.contentType.publish({ contentTypeId }, { sys: { version } as any });
    // Some adapters return no body on publish; re-fetch to confirm state
    ct = await cma.contentType.get({ contentTypeId });
  }

  return ct;
}

/**
 * Ensures this app is set as the Entry Editor for the given content type.
 * Best-effort: logs and returns silently if the API shape differs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureAppEntryEditor(cma: any, contentTypeId: string, appId?: string) {
  try {
    if (!appId) return;
    const ei = await cma.editorInterface.get({ contentTypeId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editors = Array.isArray((ei as any).editors) ? [...(ei as any).editors] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasApp = editors.some((e: any) => e?.widgetNamespace === 'app' && e?.widgetId === appId);
    if (hasApp) {
      return;
    }
    const next = {
      ...ei,
      editors: [{ widgetNamespace: 'app', widgetId: appId }, ...editors]
    };
    await cma.editorInterface.update({ contentTypeId }, next);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    // Best-effort: silently continue if editor interface update fails
  }
}


