/**
 * Required configuration, read from `.env` (see `.env.example`).
 *
 * Nothing here is hardcoded on purpose: this repo is meant to be handed to someone else, so the
 * organization, space and app definition all come from the environment. A missing value fails with
 * the name of what is missing rather than a 404 from the CMA fifty lines later.
 */

export function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in — see the README.`);
  }
  return value.trim();
}

export function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

/** The organization that owns the app definition. */
export const orgId = () => required('CONTENTFUL_ORG_ID');

/** A Contentful CMA personal access token with app-management rights in that organization. */
export const accessToken = () => required('CONTENTFUL_ACCESS_TOKEN');

export const appDefinitionId = () => required('CONTENTFUL_APP_DEF_ID');
