const fs = require('fs');
const path = require('path');
const contentful = require('contentful-management');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      return;
    }

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const readArgs = (argv) => {
  return argv.reduce(
    (acc, arg, index) => {
      if (arg === '--dry-run') {
        return { ...acc, dryRun: true };
      }

      if (arg.startsWith('--')) {
        const [key, inlineValue] = arg.slice(2).split('=');
        const value = inlineValue ?? argv[index + 1];
        return { ...acc, [key]: value };
      }

      return acc;
    },
    {}
  );
};

const omitSys = ({ sys, ...definition }) => definition;

const replaceHostPlaceholder = (value, host) => {
  if (Array.isArray(value)) {
    return value.map((item) => replaceHostPlaceholder(item, host));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceHostPlaceholder(item, host)])
    );
  }

  if (typeof value === 'string' && value.includes('<host>') && host) {
    return value.replaceAll('<host>', host.replace(/\/$/, ''));
  }

  return value;
};

const readDefinition = (filePath) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const definition = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  return omitSys(definition);
};

const assertRequired = (value, label) => {
  if (!value) {
    throw new Error(`Missing ${label}. Provide it as an argument or environment variable.`);
  }
};

const main = async () => {
  const args = readArgs(process.argv.slice(2));
  loadEnvFile(args.env ?? path.join(__dirname, '..', '.env'));

  const filePath = args.file ?? path.join(__dirname, '..', 'contentful-app-definition.json');
  const accessToken = args.token ?? process.env.CONTENTFUL_ACCESS_TOKEN;
  const organizationId = args['org-id'] ?? process.env.CONTENTFUL_ORG_ID;
  const appDefinitionId =
    args['definition-id'] ?? process.env.CONTENTFUL_APP_DEF_ID ?? process.env.CONTENTFUL_APP_DEFINITION_ID;
  const appHost = args.host ?? process.env.CONTENTFUL_APP_HOST;
  const definition = replaceHostPlaceholder(readDefinition(filePath), appHost);

  if (args.dryRun) {
    console.log(JSON.stringify({ mode: appDefinitionId ? 'update' : 'create', organizationId, appDefinitionId, definition }, null, 2));
    return;
  }

  assertRequired(accessToken, 'Contentful access token');
  assertRequired(organizationId, 'Contentful organization id');

  if (JSON.stringify(definition).includes('<host>')) {
    assertRequired(appHost, 'app host');
  }

  const client = contentful.createClient({ accessToken }, { type: 'plain' });

  if (appDefinitionId) {
    const currentDefinition = await client.appDefinition.get({ organizationId, appDefinitionId });
    const updatedDefinition = await client.appDefinition.update(
      { organizationId, appDefinitionId },
      { ...currentDefinition, ...definition, sys: currentDefinition.sys }
    );

    console.log(`Updated app definition ${updatedDefinition.sys.id}: ${updatedDefinition.name}`);
    return;
  }

  const createdDefinition = await client.appDefinition.create({ organizationId }, definition);
  console.log(`Created app definition ${createdDefinition.sys.id}: ${createdDefinition.name}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
