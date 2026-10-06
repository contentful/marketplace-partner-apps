// The auto-tagging decision, separated from the function handler so it can be driven by a fake CMA
// in tests. It takes its clients rather than creating them.

type Link = { sys: { id: string; linkType?: string } };
type Page<T> = { items: T[]; total: number };
type PageQuery = { limit: number; skip: number };

export type TagLink = { sys: { type: 'Link'; linkType: 'Tag'; id: string } };

export interface EntryLike {
  sys: { version: number; createdBy?: Link };
  metadata?: { tags?: TagLink[] };
}

export type TagPatch = { op: 'add' | 'replace'; path: '/metadata/tags'; value: TagLink[] };

/** Entry and tag access. In the function this is the app identity, `context.cma`. */
export interface AutoTagCma {
  entry: {
    get(params: { spaceId: string; environmentId: string; entryId: string }): Promise<EntryLike>;
    patch(params: { spaceId: string; environmentId: string; entryId: string; version: number }, ops: TagPatch[]): Promise<unknown>;
  };
  tag: {
    getMany(params: { spaceId: string; environmentId: string; query: PageQuery }): Promise<Page<{ sys: { id: string }; name: string }>>;
  };
}

/** Membership and role access. Needs a PAT: app identity cannot read who is a member of a space. */
export interface RoleLookupCma {
  spaceMember: {
    getMany(params: { spaceId: string; query: PageQuery }): Promise<Page<{ sys: { user: Link }; admin: boolean; roles: Link[] }>>;
  };
  role: {
    getMany(params: { spaceId: string; query: PageQuery }): Promise<Page<{ sys: { id: string }; name: string }>>;
  };
}

export interface AutoTagParameters {
  enabledTagGroups: string[];
  roleTagMapping: Record<string, string[]>; // roleId -> tagId[]
  cmaToken: string;
}

export type DroppedTag = { id: string; why: 'not-in-enabled-group' | 'tag-deleted' };

// A type alias rather than an interface so it satisfies the App Action's Record<string, unknown> return.
export type AutoTagOutcome = {
  /** Empty when a simulated run was given no entry. */
  entryId: string;
  appliedTagIds: string[];
  skippedTagIds: string[];
  /** Why nothing was applied, when nothing was. */
  reason?: string;
  /** True when nothing was written: the troubleshooting tab's run. */
  dryRun?: boolean;
  /** The roles that decided the result, once known. */
  roles?: Array<{ id: string; name: string }>;
  /** What a real run would add. Set on a dry run. */
  wouldApplyTagIds?: string[];
  /** Mapped tags that were not applied, and why. */
  droppedTagIds?: DroppedTag[];
};

/** How a call was asked to run. An Automation sends neither field, which is a real run. */
export interface RunOptions {
  dryRun: boolean;
  /** Use this role instead of the entry creator's. Only allowed on a dry run. */
  simulateRoleId?: string;
}

type Log = (...args: unknown[]) => void;

const MAX_PATCH_ATTEMPTS = 3;

// Installation parameters have no List or Object type, so arrays and objects arrive as JSON strings.
export function parseJsonParam<T>(val: unknown, fallback: T): T {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val != null ? (val as T) : fallback;
}

export function readParameters(raw: unknown): AutoTagParameters {
  const params = (raw ?? {}) as Record<string, unknown>;
  const cmaToken = typeof params.cmaToken === 'string' ? params.cmaToken : '';
  if (!cmaToken) {
    throw new Error('[autoTagByRole] no cmaToken in installation parameters — add it in the app config');
  }
  return {
    enabledTagGroups: parseJsonParam<string[]>(params.enabledTagGroups, []),
    roleTagMapping: parseJsonParam<Record<string, string[]>>(params.roleTagMapping, {}),
    cmaToken,
  };
}

/** Reads every page. `limit` above 100 is silently capped by some CMA listings, so ask for 100. */
export async function getAll<T>(fetchPage: (query: PageQuery) => Promise<Page<T>>): Promise<T[]> {
  const limit = 100;
  const items: T[] = [];
  for (let skip = 0; ; skip += limit) {
    const page = await fetchPage({ limit, skip });
    items.push(...page.items);
    if (page.items.length === 0 || items.length >= page.total) return items;
  }
}

/** The CMA rejects a patch against a stale version with 409 VersionMismatch. */
export function isVersionConflict(err: unknown): boolean {
  const e = err as { name?: string; status?: number; message?: string } | null;
  if (!e) return false;
  if (e.name === 'VersionMismatch' || e.status === 409) return true;
  try {
    return (JSON.parse(e.message ?? '') as { status?: number }).status === 409;
  } catch {
    return false;
  }
}

// Contentful entry IDs are 1–64 characters of letters, digits, `-`, `_` and `.`.
const ENTRY_ID = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * The action body comes from whatever called the App Action, so it is checked before it reaches a CMA
 * URL rather than trusted.
 */
export function readEntryId(body: unknown): string {
  const entryId = (body as { entryId?: unknown } | null)?.entryId;
  if (typeof entryId !== 'string' || !ENTRY_ID.test(entryId)) {
    throw new Error('[autoTagByRole] entryId must be a Contentful entry ID (1–64 of A–Z a–z 0–9 . _ -)');
  }
  return entryId;
}

/**
 * The run options from the action body. Booleans may arrive as strings, so `"true"` counts.
 * Simulating a role is refused on a real run: it would write tags based on a role the creator does
 * not hold.
 */
export function readRunOptions(body: unknown): RunOptions {
  const b = (body ?? {}) as { dryRun?: unknown; simulateRoleId?: unknown };
  const dryRun = b.dryRun === true || b.dryRun === 'true';
  const raw = typeof b.simulateRoleId === 'string' ? b.simulateRoleId.trim() : '';
  if (!raw) return { dryRun };
  if (!ENTRY_ID.test(raw)) {
    throw new Error('[autoTagByRole] simulateRoleId must be a Contentful role ID');
  }
  if (!dryRun) {
    throw new Error('[autoTagByRole] simulateRoleId is only allowed on a dry run — pass dryRun: true');
  }
  return { dryRun, simulateRoleId: raw };
}

/**
 * The entry ID, which a real run always needs and a simulated run may leave out. When it is present
 * it is validated either way.
 */
export function readOptionalEntryId(body: unknown, options: RunOptions): string | undefined {
  const entryId = (body as { entryId?: unknown } | null)?.entryId;
  if (options.simulateRoleId && (entryId === undefined || entryId === null || entryId === '')) {
    return undefined;
  }
  return readEntryId(body);
}

/** The group of a `"Group: value"` tag name, or null when the name has no group prefix. */
export function groupOf(tagName: string): string | null {
  const i = tagName.indexOf(': ');
  return i === -1 ? null : tagName.slice(0, i).trim();
}

export async function autoTagEntry(opts: {
  cma: AutoTagCma;
  patCma: RoleLookupCma;
  spaceId: string;
  environmentId: string;
  /** Required, except on a simulated run. */
  entryId?: string;
  params: Pick<AutoTagParameters, 'enabledTagGroups' | 'roleTagMapping'>;
  options?: RunOptions;
  log?: Log;
}): Promise<AutoTagOutcome> {
  const { cma, patCma, spaceId, environmentId, params, log = console.log } = opts;
  const { dryRun, simulateRoleId } = opts.options ?? { dryRun: false };
  const entryId = opts.entryId ?? '';
  const { enabledTagGroups, roleTagMapping } = params;
  if (!entryId && !simulateRoleId) throw new Error('[autoTagByRole] entryId is required');
  if (simulateRoleId && !dryRun) throw new Error('[autoTagByRole] simulateRoleId is only allowed on a dry run');

  // Whatever has been worked out so far travels with an early return, so a dry run shows how far it got.
  const trace: Partial<AutoTagOutcome> = dryRun ? { dryRun: true } : {};
  const nothing = (reason: string, skippedTagIds: string[] = []): AutoTagOutcome => {
    log('[autoTagByRole]', reason);
    return { entryId, appliedTagIds: [], skippedTagIds, reason, ...trace };
  };

  if (dryRun) log('[autoTagByRole] dry run — nothing will be written');

  if (Object.keys(roleTagMapping).length === 0 || enabledTagGroups.length === 0) {
    return nothing('nothing configured — roleTagMapping or enabledTagGroups is empty');
  }

  let entry: EntryLike | undefined = entryId ? await cma.entry.get({ spaceId, environmentId, entryId }) : undefined;

  let roleIds: string[];
  let tags: Array<{ sys: { id: string }; name: string }>;
  let roles: Array<{ sys: { id: string }; name: string }>;

  if (simulateRoleId) {
    // The creator is replaced by the chosen role, so membership is not read. Roles still are, through
    // the same token a real run uses, so a broken token fails here exactly as it would there.
    [tags, roles] = await Promise.all([
      getAll((query) => cma.tag.getMany({ spaceId, environmentId, query })),
      getAll((query) => patCma.role.getMany({ spaceId, query })),
    ]);
    const role = roles.find((r) => r.sys.id === simulateRoleId);
    if (!role) return nothing(`role ${simulateRoleId} does not exist in space ${spaceId}`);
    log(`[autoTagByRole] simulating role ${role.name} (${role.sys.id}) instead of the entry's creator`);
    roleIds = [simulateRoleId];
  } else {
    const createdBy = entry!.sys.createdBy?.sys;
    if (!createdBy?.id) return nothing('could not resolve createdBy from entry sys');
    if (createdBy.linkType && createdBy.linkType !== 'User') {
      return nothing(`entry was created by a ${createdBy.linkType}, not a user — no roles to map`);
    }
    const userId = createdBy.id;

    // space_members is the EFFECTIVE membership: one row per user who can access the space, whether
    // they were added directly or through a Team, carrying the roles from every route combined. So one
    // listing covers both cases and needs no organization ID, unlike walking team memberships.
    let members: Array<{ sys: { user: Link }; admin: boolean; roles: Link[] }>;
    [members, tags, roles] = await Promise.all([
      getAll((query) => patCma.spaceMember.getMany({ spaceId, query })),
      getAll((query) => cma.tag.getMany({ spaceId, environmentId, query })),
      getAll((query) => patCma.role.getMany({ spaceId, query })),
    ]);

    const member = members.find((m) => m.sys.user.sys.id === userId);
    if (!member) return nothing(`user ${userId} is not a member of space ${spaceId}`);

    roleIds = [...new Set(member.roles.map((r) => r.sys.id))];
    if (roleIds.length === 0) {
      // A space admin has no roles — admin is a flag, not a role — so no mapping can match.
      return nothing(
        member.admin ? `user ${userId} is a space admin; admins hold no roles, so no role mapping applies` : `user ${userId} has no roles in space ${spaceId}`
      );
    }
  }

  const roleNameById = new Map(roles.map((r) => [r.sys.id, r.name]));
  const tagNameById = new Map(tags.map((t) => [t.sys.id, t.name]));
  const describeTags = (ids: string[]) => ids.map((id) => `${tagNameById.get(id) ?? id} (${id})`).join(', ') || '(none)';
  trace.roles = roleIds.map((id) => ({ id, name: roleNameById.get(id) ?? id }));

  if (!simulateRoleId) {
    log('[autoTagByRole] user', entry!.sys.createdBy!.sys.id, 'has roles:', roleIds.map((id) => `${roleNameById.get(id) ?? id} (${id})`).join(', '));
  }

  const candidateTagIds = new Set<string>();
  for (const roleId of roleIds) {
    for (const tagId of roleTagMapping[roleId] ?? []) candidateTagIds.add(tagId);
  }
  if (candidateTagIds.size === 0) {
    return nothing("no tags mapped for any of the user's roles — check roleTagMapping keys match role IDs");
  }

  const enabledTagIds = new Set(tags.filter((t) => enabledTagGroups.includes(groupOf(t.name) ?? '')).map((t) => t.sys.id));
  // A mapped tag that no longer exists in the space is dropped here too, rather than 422ing the patch.
  const tagIdsToApply = [...candidateTagIds].filter((id) => enabledTagIds.has(id));
  const dropped: DroppedTag[] = [...candidateTagIds]
    .filter((id) => !enabledTagIds.has(id))
    .map((id) => ({ id, why: tagNameById.has(id) ? 'not-in-enabled-group' : 'tag-deleted' }));
  if (dropped.length > 0) {
    trace.droppedTagIds = dropped;
    log(
      '[autoTagByRole] mapped but not applied:',
      dropped.map((d) => `${tagNameById.get(d.id) ?? d.id} (${d.id}) — ${d.why === 'tag-deleted' ? 'no longer exists' : 'its group is not enabled'}`).join(', ')
    );
  }
  if (tagIdsToApply.length === 0) {
    return nothing(`mapped tags are not in an enabled tag group (enabled: ${enabledTagGroups.join(', ')})`);
  }

  if (dryRun) {
    const existingTagIds = new Set((entry?.metadata?.tags ?? []).map((t) => t.sys.id));
    const toAdd = tagIdsToApply.filter((id) => !existingTagIds.has(id));
    const skippedTagIds = tagIdsToApply.filter((id) => existingTagIds.has(id));
    trace.wouldApplyTagIds = toAdd;
    if (toAdd.length === 0) return nothing('all mapped tags already present', skippedTagIds);
    log('[autoTagByRole] dry run — would add:', describeTags(toAdd));
    return { entryId, appliedTagIds: [], skippedTagIds, ...trace };
  }

  // The automation fires while the editor may still be typing, so the patch races their autosave.
  // On a version conflict, re-read and recompute from the fresh tags rather than overwriting them.
  for (let attempt = 1; ; attempt++) {
    const current = entry!;
    const existingTags = current.metadata?.tags ?? [];
    const existingTagIds = new Set(existingTags.map((t) => t.sys.id));
    const toAdd = tagIdsToApply.filter((id) => !existingTagIds.has(id));
    const skippedTagIds = tagIdsToApply.filter((id) => existingTagIds.has(id));

    if (toAdd.length === 0) return nothing('all mapped tags already present', skippedTagIds);

    log('[autoTagByRole] patching entry with:', describeTags(toAdd));
    try {
      await cma.entry.patch({ spaceId, environmentId, entryId, version: current.sys.version }, [
        {
          // `replace` on a path that does not exist is rejected, and an entry can arrive with no
          // metadata.tags at all.
          op: current.metadata?.tags ? 'replace' : 'add',
          path: '/metadata/tags',
          value: [...existingTags, ...toAdd.map((id): TagLink => ({ sys: { type: 'Link', linkType: 'Tag', id } }))],
        },
      ]);
      return { entryId, appliedTagIds: toAdd, skippedTagIds, ...trace };
    } catch (err) {
      if (!isVersionConflict(err) || attempt >= MAX_PATCH_ATTEMPTS) throw err;
      log(`[autoTagByRole] version conflict on attempt ${attempt}, re-reading entry`);
      entry = await cma.entry.get({ spaceId, environmentId, entryId });
    }
  }
}
