/**
 * Creates or updates the "Auto-tag by Role" App Action from `contentful-app-manifest.json`.
 *
 * Why not `contentful-app-scripts upsert-actions`: it matches an existing action on the manifest's
 * `id`, but an action's `sys.id` may be generated rather than equal to it (this app's original one is).
 * It then finds nothing and creates a SECOND action, leaving the Automation calling the old one. This
 * matches on the function the action invokes instead, which is unique to this app's one action.
 *
 * Run after `npm run upload-ci`, which is what registers the function the action points at.
 *
 * Usage: npm run sync-action
 */
import { readFileSync } from 'node:fs';
import { createClient } from 'contentful-management';
import { accessToken, appDefinitionId, orgId } from './env';
import { fail } from './fail';

interface ManifestAction {
  id: string;
  name: string;
  description?: string;
  type: 'function-invocation';
  functionId: string;
  category: string;
  parameters?: unknown[];
}

async function main() {
  const manifest = JSON.parse(readFileSync('contentful-app-manifest.json', 'utf8')) as {
    actions: ManifestAction[];
  };
  if (manifest.actions.length !== 1) throw new Error('Expected exactly one action in the manifest');
  const [action] = manifest.actions;

  const cma = createClient({ accessToken: accessToken() }, { type: 'plain' });
  const params = { organizationId: orgId(), appDefinitionId: appDefinitionId() };

  const payload = {
    name: action.name,
    description: action.description,
    category: action.category,
    type: action.type,
    function: { sys: { type: 'Link', linkType: 'Function', id: action.functionId } },
    parameters: action.parameters ?? [],
  } as unknown as Parameters<typeof cma.appAction.update>[1];

  const existing = await cma.appAction.getMany(params);
  const match = existing.items.filter((a) => (a as unknown as { function?: { sys: { id: string } } }).function?.sys.id === action.functionId);
  if (match.length > 1) {
    throw new Error(
      `${match.length} actions invoke ${action.functionId}: ${match.map((a) => a.sys.id).join(', ')}. ` +
        'Delete the extras in the web app first, keeping the one your Automations call.'
    );
  }

  const saved = match[0] ? await cma.appAction.update({ ...params, appActionId: match[0].sys.id }, payload) : await cma.appAction.create(params, payload);

  console.log(`${match[0] ? 'Updated' : 'Created'} action "${saved.name}" (${saved.sys.id})`);
  for (const p of (saved as unknown as { parameters?: Array<{ id: string; type: string; required?: boolean }> }).parameters ?? []) {
    console.log(`  - ${p.id} : ${p.type}${p.required ? ' (required)' : ''}`);
  }
}

main().catch(fail);
