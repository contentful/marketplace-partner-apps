/**
 * Attaches an uploaded AppBundle to the app definition AND sets its locations, in a single PUT.
 * Replaces `contentful-app-scripts activate` for this app.
 *
 * Both have to happen in the same request because of a circular validation rule:
 *
 *   - PUT with locations but no bundle → 422 "Cannot define locations if neither src nor frontend
 *     bundle are present"
 *   - PUT with a bundle but no real locations → 422 "Must define at least one location other than
 *     \"dialog\" if src or frontend bundle is present"
 *
 * `contentful-app-scripts activate` sends `locations: [{ location: 'dialog' }]` when the definition has
 * none, so it always trips the second rule on a first activation. Uploads therefore use
 * --skip-activation and this script finishes the job.
 *
 * The config screen is the app's only UI, so the locations are always set to exactly LOCATIONS. That
 * also removes locations an earlier version declared.
 *
 * Usage:
 *   npm run activate                      # newest bundle
 *   npm run activate -- <appBundleId>     # a specific bundle
 */
import { createClient } from 'contentful-management';
import { accessToken, appDefinitionId, orgId } from './env';
import { fail } from './fail';

const LOCATIONS = [{ location: 'app-config' }];

async function main() {
  const cma = createClient({ accessToken: accessToken() }, { type: 'plain' });
  const params = { organizationId: orgId(), appDefinitionId: appDefinitionId() };
  let bundleId = process.argv[2];

  if (!bundleId) {
    const bundles = await cma.appBundle.getMany({ ...params, query: { limit: 100 } });
    if (bundles.items.length === 0) {
      throw new Error('No app bundles found — run `npm run build:all && npm run upload-ci` first');
    }
    const newest = [...bundles.items].sort((a, b) => Date.parse(a.sys.createdAt) - Date.parse(b.sys.createdAt)).pop()!;
    bundleId = newest.sys.id;
    console.log(`Newest bundle: ${bundleId} (created ${newest.sys.createdAt})`);
  }

  const definition = await cma.appDefinition.get(params);

  // `src` and `bundle` are mutually exclusive. Dropping src is what switches the definition over to
  // Contentful hosting; re-set it by hand for local development.
  const { src: previousSrc, ...withoutSrc } = definition as unknown as Record<string, unknown> & {
    src?: string;
  };
  if (previousSrc) console.log(`Dropping src (${previousSrc}) in favour of the bundle`);

  const updated = await cma.appDefinition.update(params, {
    ...withoutSrc,
    locations: LOCATIONS,
    bundle: { sys: { id: bundleId, type: 'Link', linkType: 'AppBundle' } },
  } as unknown as Parameters<typeof cma.appDefinition.update>[1]);

  const locations = (updated as unknown as { locations?: Array<{ location: string }> }).locations ?? [];
  console.log(`Activated "${updated.name}" (${updated.sys.id})`);
  console.log(`  bundle:    ${bundleId}`);
  console.log(`  locations: ${locations.map((l) => l.location).join(', ')}`);
}

main().catch(fail);
