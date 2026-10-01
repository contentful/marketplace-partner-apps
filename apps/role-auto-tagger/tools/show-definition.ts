/**
 * Prints the app definition as Contentful has it — locations, declared installation parameters, the
 * attached bundle and the registered App Actions — and flags anything that differs from what this repo
 * expects.
 *
 * Usage: npm run show-definition
 */
import { createClient } from 'contentful-management';
import { accessToken, appDefinitionId, orgId } from './env';
import { fail } from './fail';
import { PARAMETERS } from './parameters';

async function main() {
  const cma = createClient({ accessToken: accessToken() }, { type: 'plain' });
  const params = { organizationId: orgId(), appDefinitionId: appDefinitionId() };
  const definition = (await cma.appDefinition.get(params)) as unknown as {
    name: string;
    sys: { id: string };
    src?: string;
    bundle?: { sys: { id: string } };
    locations?: Array<{ location: string }>;
    parameters?: { installation?: Array<{ id: string; type: string }> };
  };

  console.log(`${definition.name} (${definition.sys.id})`);
  console.log(`  src:       ${definition.src ?? '—'}`);
  console.log(`  bundle:    ${definition.bundle?.sys.id ?? '— none attached'}`);
  console.log(`  locations: ${(definition.locations ?? []).map((l) => l.location).join(', ') || '— none'}`);

  const installation = definition.parameters?.installation ?? [];
  const expected = new Map(PARAMETERS.map((p) => [p.id, p.type]));
  console.log(`  installation parameters (${installation.length}, expected ${expected.size}):`);
  for (const p of installation) {
    const note = !expected.has(p.id)
      ? '   <-- not declared by this repo (npm run sync-parameters -- --prune)'
      : expected.get(p.id) !== p.type
      ? `   <-- expected ${expected.get(p.id)}`
      : '';
    console.log(`    - ${p.id} : ${p.type}${note}`);
  }
  const declared = new Set(installation.map((p) => p.id));
  const missing = [...expected.keys()].filter((id) => !declared.has(id));
  if (missing.length > 0) console.log(`    MISSING (npm run sync-parameters): ${missing.join(', ')}`);

  // The tagging runs in one App Action, called by a Contentful Automation the customer creates.
  const actions = await cma.appAction.getMany(params);
  console.log(`  app actions (${actions.items.length}, expected 1):`);
  for (const action of actions.items) {
    console.log(`    - ${action.sys.id} : ${action.name}`);
  }
}

main().catch(fail);
