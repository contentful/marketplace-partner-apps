# Agent Guide — role-auto-tagger

## What This App Does

Tags a new entry automatically with the tags mapped to its creator's roles. A Contentful
**Automation** calls the app's **Auto-tag by Role** App Action on entry creation. The action reads
`sys.createdBy`, resolves that user's roles, and adds the mapped tags. The config screen is the only
UI: it holds the mapping, plus a Troubleshooting tab that dry-runs the same action.

## Archetype

Standard Vite app (React + TypeScript + Vitest + Forma 36), plus one App Function.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configuration tab (token, tag groups, role → tag mapping) and Troubleshooting tab |
| — | `src/components/Troubleshooting.tsx` | Dry run of the real action for a chosen role |

No entry location. The Automation is created by the customer, because the App SDK does not permit
apps to create Automations.

## Functions and actions

| Function | Accepts | Action parameters |
|----------|---------|-------------------|
| `autoTagByRole` (`src/functions/autoTagByRole.ts`) | `appaction.call` | `entryId`; plus `dryRun` and `simulateRoleId` for troubleshooting, which an Automation leaves unset |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk`, `@contentful/react-apps-toolkit` | SDK and `useSDK()` |
| `@contentful/f36-components` | Forma 36 UI |
| `contentful-management` | PAT client inside the function |
| `@contentful/node-apps-toolkit` | Function handler types |

## Source Layout

```
src/
├── lib/autoTag.ts         # the engine: takes its clients, so it is testable  ← the logic
├── lib/errors.ts          # describeError(): one readable line from a CMA failure
├── lib/__tests__/         # Vitest against a fake CMA (testkit.ts)
├── functions/autoTagByRole.ts
├── components/Troubleshooting.tsx
└── locations/ConfigScreen.tsx
tools/                     # setup scripts: create-app-definition, sync-parameters, activate, sync-action
```

## Sharp Edges & Invariants

- **Two credentials, deliberately.** Entry and tag reads and the tag write use the app identity
  (`context.cma`). `space_members` and `roles` need a PAT (the `cmaToken` Secret parameter). An app
  token gets `401 AccessTokenInvalid` on both. Do not move any other call onto the PAT.
- **`space_members` is the effective membership.** It covers direct and team members in one listing
  and needs no organization ID. Do not replace it with `space_memberships`, which lists direct
  members only.
- **The engine takes clients, never creates them.** That is what lets `testkit.ts` drive it.
- **A simulated role can never write.** `simulateRoleId` is refused without `dryRun`, both in
  `readRunOptions` and in `autoTagEntry`. Keep both checks.
- **A thrown error loses its message on the way to the caller.** The caller sees only
  `failed (code-error)`. So a dry run *returns* `{ failed, error, log }`, while a real run still
  throws, so the Automation records it as failed. The handler mirrors every log line into the result,
  because a Marketplace customer cannot read function logs.
- **`createWithResult` puts status, result and error under `sys`,** not at the top level.
- **Log and reason strings are user-facing.** They appear verbatim in the Troubleshooting tab and in
  the README's troubleshooting table, so change all three together.
- **axios is pinned to 1.19.0** (`overrides`). From 1.20, its fetch adapter sets a `cache` option
  that the Functions runtime rejects, so every CMA call fails. The build passes regardless. After
  `build:all`, `grep -c 'cache:"default"' build/src/functions/autoTagByRole.js` must be 0.
- **`contentful-sdk-core` is pinned to 9.4.5** (`overrides`). Version 10, pulled in by
  `contentful-management` 12, declares `node >=22`, and the MPA CI installs on Node 20 with
  `engine-strict`, so it fails `npm ci`. 9.4.5 exports everything CMA 12 imports from it. Do not
  remove the pin while CI is on Node 20.
- **`roleTagMapping` is keyed by role ID**, which is per space. Each space is configured on its own.
- **Space admins hold no roles,** so no mapping applies to them, and the action reports that.
- **Updating the action is `npm run sync-action`, not `upsert-actions`.** The latter matches on the
  manifest ID and can create a duplicate when the live action's ID was generated.

## Tests

`npm test` covers role resolution, idempotency, the `add`/`replace` patch choice, version-conflict
retry, pagination, input validation, dry run, role simulation and error formatting, all with no
credentials. Membership against the real CMA is checked by `npm run check-members`, which is
read-only.
