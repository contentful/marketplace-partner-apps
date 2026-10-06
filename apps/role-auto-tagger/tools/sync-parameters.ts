/**
 * Declares this app's installation parameters on the app definition, idempotently.
 *
 * Required because the CMA validates `parameters` on an AppInstallation strictly against the
 * definition: saving the config screen with an undeclared key returns 422 "The property X is not
 * expected". A definition created in the web app declares none, so the first save fails without this.
 *
 * Parameters this repo does not declare are KEPT, since they may belong to a newer version of the app
 * than this checkout. `--prune` undeclares them, for a parameter that is genuinely retired. A value
 * already stored on an installation survives being undeclared; what matters is that the config screen
 * stops sending it.
 *
 * Usage: npm run sync-parameters [-- --prune]
 */
import { createClient } from 'contentful-management';
import { accessToken, appDefinitionId, orgId } from './env';
import { fail } from './fail';
import { PARAMETERS, type DefinitionParameter } from './parameters';

async function main() {
  const cma = createClient({ accessToken: accessToken() }, { type: 'plain' });
  const params = { organizationId: orgId(), appDefinitionId: appDefinitionId() };
  const definition = await cma.appDefinition.get(params);

  const existing = (definition as unknown as { parameters?: { installation?: DefinitionParameter[] } }).parameters?.installation ?? [];
  const ours = new Set(PARAMETERS.map((p) => p.id));
  const others = existing.filter((p) => !ours.has(p.id));

  const prune = process.argv.includes('--prune');
  if (others.length > 0) {
    const ids = others.map((p) => p.id).join(', ');
    console.log(prune ? `Undeclaring: ${ids}` : `Keeping undeclared (pass --prune to remove): ${ids}`);
  }

  // appDefinition.update is a full replace: spread the definition so the bundle, locations and
  // everything else survive.
  const updated = (await cma.appDefinition.update(params, {
    ...definition,
    parameters: {
      ...((definition as unknown as { parameters?: Record<string, unknown> }).parameters ?? {}),
      installation: [...PARAMETERS, ...(prune ? [] : others)],
    },
  } as unknown as Parameters<typeof cma.appDefinition.update>[1])) as unknown as {
    parameters?: { installation?: DefinitionParameter[] };
  };

  console.log(`Declared installation parameters on ${params.appDefinitionId}:`);
  for (const parameter of updated.parameters?.installation ?? []) {
    console.log(`  - ${parameter.id} : ${parameter.type}`);
  }
}

main().catch(fail);
