// An in-memory stand-in for the two CMA clients autoTagEntry takes. Reads come from fixtures; the
// only write, entry.patch, is recorded and applied so a retry sees the result of an earlier call.

import type { AutoTagCma, EntryLike, RoleLookupCma, TagLink, TagPatch } from '../autoTag';

export interface Member {
  userId: string;
  admin?: boolean;
  roleIds: string[];
}

export interface Fixture {
  entry: EntryLike;
  tags: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
  /** Effective space membership, as the space_members endpoint reports it: direct and team combined. */
  members: Member[];
  /** Makes the first N patches fail with a version conflict, each bumping the stored version. */
  conflicts?: number;
  /** Applied to the stored entry when a conflict happens — someone else's concurrent edit. */
  onConflict?: (entry: EntryLike) => void;
}

export const tag = (id: string): TagLink => ({ sys: { type: 'Link', linkType: 'Tag', id } });

export const createdBy = (id: string, linkType = 'User') => ({ sys: { id, linkType } });

function paged<T>(all: T[], query: { limit: number; skip: number }) {
  return { items: all.slice(query.skip, query.skip + query.limit), total: all.length };
}

export function fakeCma(fixture: Fixture) {
  let stored: EntryLike = structuredClone(fixture.entry);
  let conflictsLeft = fixture.conflicts ?? 0;
  const patches: Array<{ version: number; ops: TagPatch[] }> = [];
  const pageRequests: Record<string, number> = { spaceMember: 0, role: 0, tag: 0, entryGet: 0 };

  const cma: AutoTagCma = {
    entry: {
      get: async () => {
        pageRequests.entryGet++;
        return structuredClone(stored);
      },
      patch: async ({ version }, ops) => {
        patches.push({ version, ops: structuredClone(ops) });
        if (version !== stored.sys.version) {
          throw Object.assign(new Error('version mismatch'), { name: 'VersionMismatch', status: 409 });
        }
        if (conflictsLeft > 0) {
          conflictsLeft--;
          fixture.onConflict?.(stored);
          stored.sys.version++;
          throw Object.assign(new Error('version mismatch'), { name: 'VersionMismatch', status: 409 });
        }
        for (const op of ops) {
          if (op.op === 'replace' && !stored.metadata?.tags) {
            throw Object.assign(new Error('cannot replace a missing path'), { status: 422 });
          }
          stored = { ...stored, metadata: { ...stored.metadata, tags: op.value } };
        }
        stored.sys.version++;
        return stored;
      },
    },
    tag: {
      getMany: async ({ query }) => {
        pageRequests.tag++;
        return paged(
          fixture.tags.map((t) => ({ sys: { id: t.id }, name: t.name })),
          query
        );
      },
    },
  };

  const patCma: RoleLookupCma = {
    spaceMember: {
      getMany: async ({ query }) => {
        pageRequests.spaceMember++;
        return paged(
          fixture.members.map((m) => ({
            sys: { user: { sys: { id: m.userId, linkType: 'User' } } },
            admin: m.admin ?? false,
            roles: m.roleIds.map((id) => ({ sys: { id, linkType: 'Role' } })),
          })),
          query
        );
      },
    },
    role: {
      getMany: async ({ query }) => {
        pageRequests.role++;
        return paged(
          fixture.roles.map((r) => ({ sys: { id: r.id }, name: r.name })),
          query
        );
      },
    },
  };

  return { cma, patCma, patches, pageRequests, stored: () => stored };
}
