// Read-only check of the assumption the auto-tagger rests on: that `space_members` lists every user
// who can access a space, with their roles, whether they were added directly or through a Team.
//
//   npm run check-members -- <spaceId> [<spaceId> ...]
//
// For each space it builds the same answer two ways — space_members, and direct space_memberships
// plus a walk of team_space_memberships -> team members — and reports any user whose roles differ.
// Needs CONTENTFUL_ACCESS_TOKEN in .env. Writes nothing.

// contentful-management 12 is ESM, so the named import resolves under Node's native ESM.
import { createClient } from 'contentful-management';

const token = process.env.CONTENTFUL_ACCESS_TOKEN;
const spaceIds = process.argv.slice(2);
if (!token) throw new Error('CONTENTFUL_ACCESS_TOKEN is not set — add it to .env');
if (spaceIds.length === 0) throw new Error('usage: npm run check-members -- <spaceId> [<spaceId> ...]');

const cma = createClient({ accessToken: token }, { type: 'plain' });
type Links = Array<{ sys: { id: string } }>;

async function all<T>(fetch: (q: { limit: number; skip: number }) => Promise<{ items: T[]; total: number }>) {
  const out: T[] = [];
  for (let skip = 0; ; skip += 100) {
    const page = await fetch({ limit: 100, skip });
    out.push(...page.items);
    if (page.items.length === 0 || out.length >= page.total) return out;
  }
}

const describe = (a: { admin: boolean; roles: Set<string> }) => (a.admin ? 'admin' : [...a.roles].sort().join(',') || '(no roles)');

let failures = 0;
for (const spaceId of spaceIds) {
  const space = await cma.space.get({ spaceId });
  const organizationId = space.sys.organization.sys.id;

  const effective = new Map<string, { admin: boolean; roles: Set<string> }>();
  for (const m of await all((query) => cma.spaceMember.getMany({ spaceId, query }))) {
    effective.set(m.sys.user.sys.id, { admin: m.admin, roles: new Set((m.roles as Links).map((r) => r.sys.id)) });
  }

  const derived = new Map<string, { admin: boolean; roles: Set<string>; via: Set<string> }>();
  const add = (userId: string, admin: boolean, roles: Links, via: string) => {
    const d = derived.get(userId) ?? { admin: false, roles: new Set<string>(), via: new Set<string>() };
    d.admin ||= admin;
    for (const r of roles) d.roles.add(r.sys.id);
    d.via.add(via);
    derived.set(userId, d);
  };
  for (const m of await all((query) => cma.spaceMembership.getMany({ spaceId, query }))) {
    // The root-level `user` is deprecated; the CMA now carries it in `sys`.
    const userId = (m.sys as unknown as { user: { sys: { id: string } } }).user.sys.id;
    add(userId, m.admin, m.roles as Links, 'direct');
  }
  for (const tsm of await all((query) => cma.teamSpaceMembership.getMany({ spaceId, query }))) {
    const teamId = tsm.sys.team.sys.id;
    for (const tm of await all((query) => cma.teamMembership.getManyForTeam({ organizationId, teamId, query }))) {
      // `sys.user` is on every team membership the CMA returns but absent from the typings.
      const userId = (tm.sys as unknown as { user: { sys: { id: string } } }).user.sys.id;
      add(userId, tsm.admin, tsm.roles as Links, `team ${teamId}`);
    }
  }

  console.log(`\n${space.name} (${spaceId})`);
  for (const userId of new Set([...effective.keys(), ...derived.keys()])) {
    const e = effective.get(userId);
    const d = derived.get(userId);
    // An admin holds no roles, so only the admin flag is compared for them.
    const ok = !!e && !!d && describe(e) === describe(d);
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'ok  ' : 'DIFF'} ${userId}  via ${d ? [...d.via].join(' + ') : '(nothing)'}  ` +
        `space_members=${e ? describe(e) : '(absent)'}${ok ? '' : `  derived=${d ? describe(d) : '(absent)'}`}`
    );
  }
}

console.log(failures === 0 ? '\nspace_members agrees with direct + team membership for every user.' : `\n${failures} user(s) differ.`);
process.exitCode = failures === 0 ? 0 : 1;
