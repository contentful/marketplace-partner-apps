import { describe, expect, it } from 'vitest';
import { autoTagEntry, getAll, isVersionConflict, readEntryId, readParameters } from '../autoTag';
import { createdBy, fakeCma, tag, type Fixture } from './testkit';

const EDITOR = 'role-editor';
const AUTHOR = 'role-author';

const base = (): Fixture => ({
  entry: { sys: { version: 3, createdBy: createdBy('user-1') }, metadata: { tags: [] } },
  tags: [
    { id: 'domainBe', name: 'Domain: Belgium' },
    { id: 'domainNl', name: 'Domain: Netherlands' },
    { id: 'brandAcme', name: 'Brand: Acme' },
    { id: 'untagged', name: 'No group here' },
  ],
  roles: [
    { id: EDITOR, name: 'Editor' },
    { id: AUTHOR, name: 'Author' },
  ],
  members: [{ userId: 'user-1', roleIds: [EDITOR] }],
});

const params: { enabledTagGroups: string[]; roleTagMapping: Record<string, string[]> } = {
  enabledTagGroups: ['Domain'],
  roleTagMapping: { [EDITOR]: ['domainBe'], [AUTHOR]: ['domainNl'] },
};

async function run(fixture: Fixture, p = params) {
  const fake = fakeCma(fixture);
  const outcome = await autoTagEntry({
    cma: fake.cma,
    patCma: fake.patCma,
    spaceId: 'space',
    environmentId: 'master',
    entryId: 'entry-1',
    params: p,
    log: () => {},
  });
  return { outcome, ...fake };
}

describe('role resolution — direct and team membership behave the same', () => {
  // space_members reports the effective membership, so a direct member and a team-only member are
  // indistinguishable to the engine. These two fixtures are the same data reached by different routes;
  // asserting identical results is the point.
  it('tags a user added to the space directly', async () => {
    const { outcome, stored } = await run(base());
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
    expect(stored().metadata?.tags).toEqual([tag('domainBe')]);
  });

  it('tags a user who is only in the space through a team', async () => {
    // The fake cannot prove space_members includes team members, only that the engine treats the row
    // the same way. That the CMA does include them is measured by `npm run check-members`.
    const fixture = base();
    fixture.members = [{ userId: 'user-1', roleIds: [EDITOR] }];
    const { outcome } = await run(fixture);
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
  });

  it('combines roles when a user has several (direct plus team), without duplicates', async () => {
    const fixture = base();
    fixture.members = [{ userId: 'user-1', roleIds: [EDITOR, AUTHOR, EDITOR] }];
    const { outcome } = await run(fixture);
    expect(outcome.appliedTagIds.sort()).toEqual(['domainBe', 'domainNl']);
  });

  it('needs no organization ID', async () => {
    // The previous team walk called teamMembership.getManyForTeam with a hardcoded org. The fake has
    // no team endpoints at all, so this passing proves the engine no longer reaches for one.
    const { outcome } = await run(base());
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
  });

  it('applies nothing to a space admin, and says why', async () => {
    const fixture = base();
    fixture.members = [{ userId: 'user-1', admin: true, roleIds: [] }];
    const { outcome, patches } = await run(fixture);
    expect(outcome.appliedTagIds).toEqual([]);
    expect(outcome.reason).toMatch(/space admin/);
    expect(patches).toHaveLength(0);
  });

  it('applies nothing when the creator is not a member of the space', async () => {
    const fixture = base();
    fixture.members = [{ userId: 'someone-else', roleIds: [EDITOR] }];
    const { outcome, patches } = await run(fixture);
    expect(outcome.reason).toMatch(/not a member/);
    expect(patches).toHaveLength(0);
  });

  it('applies nothing when the entry was created by an app, not a user', async () => {
    const fixture = base();
    fixture.entry.sys.createdBy = createdBy('some-app', 'AppDefinition');
    const { outcome, patches } = await run(fixture);
    expect(outcome.reason).toMatch(/AppDefinition/);
    expect(patches).toHaveLength(0);
  });
});

describe('what gets applied', () => {
  it('drops mapped tags outside the enabled tag groups', async () => {
    const { outcome } = await run(base(), {
      enabledTagGroups: ['Domain'],
      roleTagMapping: { [EDITOR]: ['domainBe', 'brandAcme'] },
    });
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
  });

  it('drops a mapped tag that no longer exists in the space rather than 422ing the patch', async () => {
    const { outcome } = await run(base(), {
      enabledTagGroups: ['Domain'],
      roleTagMapping: { [EDITOR]: ['domainBe', 'deletedTag'] },
    });
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
  });

  it('does nothing when unconfigured', async () => {
    const { outcome, patches } = await run(base(), { enabledTagGroups: [], roleTagMapping: {} });
    expect(outcome.reason).toMatch(/nothing configured/);
    expect(patches).toHaveLength(0);
  });

  it('keeps tags the entry already has', async () => {
    const fixture = base();
    fixture.entry.metadata = { tags: [tag('brandAcme')] };
    const { stored } = await run(fixture);
    expect(stored().metadata?.tags).toEqual([tag('brandAcme'), tag('domainBe')]);
  });
});

describe('writes', () => {
  it('is a no-op when every mapped tag is already present', async () => {
    const fixture = base();
    fixture.entry.metadata = { tags: [tag('domainBe')] };
    const { outcome, patches } = await run(fixture);
    expect(patches).toHaveLength(0);
    expect(outcome.skippedTagIds).toEqual(['domainBe']);
  });

  it('uses `add` when the entry has no metadata at all', async () => {
    const fixture = base();
    delete fixture.entry.metadata;
    const { outcome, patches } = await run(fixture);
    expect(patches[0].ops[0].op).toBe('add');
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
  });

  it('uses `replace` when the entry already has a tags array', async () => {
    const { patches } = await run(base());
    expect(patches[0].ops[0].op).toBe('replace');
  });

  it('retries a version conflict and keeps a tag added concurrently', async () => {
    const fixture = base();
    fixture.conflicts = 1;
    fixture.onConflict = (entry) => {
      entry.metadata = { tags: [tag('brandAcme')] };
    };
    const { outcome, patches, stored } = await run(fixture);
    expect(patches).toHaveLength(2);
    expect(patches[1].version).toBe(4);
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
    expect(stored().metadata?.tags).toEqual([tag('brandAcme'), tag('domainBe')]);
  });

  it('stops retrying when the concurrent edit already added the tag', async () => {
    const fixture = base();
    fixture.conflicts = 1;
    fixture.onConflict = (entry) => {
      entry.metadata = { tags: [tag('domainBe')] };
    };
    const { outcome, patches } = await run(fixture);
    expect(patches).toHaveLength(1);
    expect(outcome.skippedTagIds).toEqual(['domainBe']);
  });

  it('gives up after three conflicts and surfaces the error', async () => {
    const fixture = base();
    fixture.conflicts = 5;
    await expect(run(fixture)).rejects.toMatchObject({ name: 'VersionMismatch' });
  });

  it('does not retry an error that is not a version conflict', async () => {
    const fixture = base();
    const fake = fakeCma(fixture);
    fake.cma.entry.patch = async () => {
      throw Object.assign(new Error('forbidden'), { status: 403 });
    };
    await expect(
      autoTagEntry({
        cma: fake.cma,
        patCma: fake.patCma,
        spaceId: 's',
        environmentId: 'e',
        entryId: 'x',
        params,
        log: () => {},
      })
    ).rejects.toThrow('forbidden');
  });
});

describe('pagination', () => {
  it('finds a member beyond the first page', async () => {
    const fixture = base();
    fixture.members = [...Array.from({ length: 250 }, (_, i) => ({ userId: `filler-${i}`, roleIds: [AUTHOR] })), { userId: 'user-1', roleIds: [EDITOR] }];
    const { outcome, pageRequests } = await run(fixture);
    expect(outcome.appliedTagIds).toEqual(['domainBe']);
    expect(pageRequests.spaceMember).toBe(3);
  });

  it('getAll stops on an empty page even if total is wrong', async () => {
    let calls = 0;
    const items = await getAll(async () => {
      calls++;
      return { items: calls === 1 ? [1, 2] : [], total: 99 };
    });
    expect(items).toEqual([1, 2]);
    expect(calls).toBe(2);
  });
});

describe('parameters and errors', () => {
  it('reads JSON-string parameters', () => {
    const p = readParameters({ enabledTagGroups: '["Domain"]', roleTagMapping: '{"r":["t"]}', cmaToken: 'CFPAT-x' });
    expect(p).toEqual({ enabledTagGroups: ['Domain'], roleTagMapping: { r: ['t'] }, cmaToken: 'CFPAT-x' });
  });

  it('falls back on malformed JSON rather than throwing', () => {
    const p = readParameters({ enabledTagGroups: 'not json', roleTagMapping: '{', cmaToken: 'CFPAT-x' });
    expect(p.enabledTagGroups).toEqual([]);
    expect(p.roleTagMapping).toEqual({});
  });

  it('names the missing token', () => {
    expect(() => readParameters({ enabledTagGroups: '[]' })).toThrow(/cmaToken/);
    expect(() => readParameters(undefined)).toThrow(/cmaToken/);
  });

  it('recognises a version conflict in each shape the CMA client produces', () => {
    expect(isVersionConflict({ name: 'VersionMismatch' })).toBe(true);
    expect(isVersionConflict({ status: 409 })).toBe(true);
    expect(isVersionConflict(new Error(JSON.stringify({ status: 409 })))).toBe(true);
    expect(isVersionConflict({ status: 422 })).toBe(false);
    expect(isVersionConflict(null)).toBe(false);
  });
});

describe('readEntryId', () => {
  it('accepts a real entry ID', () => {
    expect(readEntryId({ entryId: '4GhKq2mNp8_x-1.y' })).toBe('4GhKq2mNp8_x-1.y');
  });

  it.each([
    ['missing', {}],
    ['empty', { entryId: '' }],
    ['not a string', { entryId: 42 }],
    ['a path', { entryId: '../../spaces/other' }],
    ['too long', { entryId: 'a'.repeat(65) }],
    ['no body', null],
  ])('rejects an entryId that is %s', (_label, body) => {
    expect(() => readEntryId(body)).toThrow(/entryId must be a Contentful entry ID/);
  });
});
