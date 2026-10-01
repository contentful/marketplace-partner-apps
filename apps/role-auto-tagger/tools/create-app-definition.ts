/**
 * Creates the app definition from scratch, for a fresh install in a new organization, and prints the
 * ID to paste into `.env`.
 *
 * Deliberately created with `src` pointing at localhost and **no bundle**: activation is circular for
 * a brand-new definition, so the bundle is attached later by `npm run activate`, which sets the bundle
 * and the real locations in one PUT. See tools/activate-bundle.ts.
 *
 * Usage: npm run create-app-definition
 */
import { createClient } from 'contentful-management';
import { accessToken, orgId } from './env';
import { fail } from './fail';

const APP_NAME = 'Role auto tagger';

async function main() {
  if (process.env.CONTENTFUL_APP_DEF_ID?.trim()) {
    console.log(
      `CONTENTFUL_APP_DEF_ID is already set to ${process.env.CONTENTFUL_APP_DEF_ID.trim()}.\n` +
        'Clear it in .env first if you really want a second definition.'
    );
    return;
  }

  const cma = createClient({ accessToken: accessToken() }, { type: 'plain' });
  const organizationId = orgId();

  const definition = await cma.appDefinition.create({ organizationId }, {
    name: APP_NAME,
    // Replaced by the uploaded bundle on the first `npm run activate`.
    src: 'http://localhost:3002',
    locations: [{ location: 'app-config' }],
  } as never);

  console.log(`Created "${APP_NAME}" in organization ${organizationId}.\n`);
  console.log(`  CONTENTFUL_APP_DEF_ID=${definition.sys.id}\n`);
  console.log('Add that line to .env, then continue with the README:');
  console.log('  npm run sync-parameters');
  console.log('  npm run build:all && npm run upload-ci && npm run activate');
}

main().catch(fail);
