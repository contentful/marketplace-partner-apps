/**
 * App-level identity surfaced in the UI. Keep the user-facing display name
 * separate from the npm package name so the latter doesn't leak into the UI.
 *
 * `__APP_VERSION__` and `__APP_PACKAGE_NAME__` are injected by Vite's `define`
 * (see `vite.config.ts` / `vitest.config.ts`) so we can avoid importing
 * `package.json` directly into the bundle.
 */

/** User-facing app name shown in the UI (hero, About card, dropdowns). */
export const APP_DISPLAY_NAME = "Markup AI for Contentful";

/** App version string (e.g. `2.0.5`). */
export const APP_VERSION: string = __APP_VERSION__;

/** Internal npm package identifier (e.g. `markup-ai-contentful-app`). Diagnostics only. */
export const APP_PACKAGE_NAME: string = __APP_PACKAGE_NAME__;
