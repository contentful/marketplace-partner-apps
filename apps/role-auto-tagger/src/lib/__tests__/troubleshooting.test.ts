// The Troubleshooting tab calls the same App Action as the Automation, with `dryRun` and optionally
// `simulateRoleId`. These cases pin what that run may and may not do.
import { describe, expect, it } from 'vitest';
import { autoTagEntry, readOptionalEntryId, readRunOptions, type RunOptions } from '../autoTag';
import { createdBy, fakeCma, tag, type Fixture } from './testkit';

const EDITOR = 'role-editor';
const AUTHOR = 'role-author';

const base = (): Fixture => ({
  entry: { sys: { version: 3, createdBy: createdBy('user-1') }, metadata: { tags: [] } },
  tags: [
    { id: 'domainBe', name: 'Domain: Belgium' },
    { id: 'domainNl', name: 'Domain: Netherlands' },
    { id: 'brandAcme', name: 'Brand: Acme' },
  ],
  roles: [
    { id: EDITOR, name: 'Editor' },
    { id: AUTHOR, name: 'Author' },
  ],
  members: [{ userId: 'user-1', roleIds: [EDITOR] }],
});

const params = {
  enabledTagGroups: ['Domain'],
  roleTagMapping: { [EDITOR]: ['domainBe'], [AUTHOR]: ['domainNl', 'brandAcme', 'deletedTag'] },
};

// `null` means no entry, since `undefined` would pick up the default.
async function run(fixture: Fixture, options: RunOptions, entry: string | null = 'entry-1') {
  const fake = fakeCma(fixture);
  const lines: string[] = [];
  const outcome = await autoTagEntry({
    cma: fake.cma,
    patCma: fake.patCma,
    spaceId: 'space',
    environmentId: 'master',
    entryId: entry ?? undefined,
    params,
    options,
    log: (...args) => lines.push(args.join(' ')),
  });
  return { outcome, lines, ...fake };
}

describe('dry run', () => {
  it("works out the creator's result and writes nothing", async () => {
    const { outcome, patches } = await run(base(), { dryRun: true });
    expect(patches).toHaveLength(0);
    expect(outcome).toMatchObject({
      dryRun: true,
      appliedTagIds: [],
      wouldApplyTagIds: ['domainBe'],
      roles: [{ id: EDITOR, name: 'Editor' }],
    });
  });

  it('reports tags already on the entry rather than proposing them again', async () => {
    const fixture = base();
    fixture.entry.metadata = { tags: [tag('domainBe')] };
    const { outcome } = await run(fixture, { dryRun: true });
    expect(outcome.reason).toBe('all mapped tags already present');
    expect(outcome.skippedTagIds).toEqual(['domainBe']);
    expect(outcome.wouldApplyTagIds).toEqual([]);
  });

  it('carries the same reason a real run logs', async () => {
    const fixture = base();
    fixture.members = [{ userId: 'user-1', admin: true, roleIds: [] }];
    const real = await run(fixture, { dryRun: false });
    const dry = await run(fixture, { dryRun: true });
    expect(dry.outcome.reason).toBe(real.outcome.reason);
    expect(dry.outcome.reason).toMatch(/space admin/);
  });
});

describe('simulating a role', () => {
  it("uses the chosen role instead of the creator's, without reading membership", async () => {
    const { outcome, pageRequests, patches } = await run(base(), { dryRun: true, simulateRoleId: AUTHOR });
    expect(pageRequests.spaceMember).toBe(0);
    // Roles are still read through the token, so a broken token fails here as it would in a real run.
    expect(pageRequests.role).toBeGreaterThan(0);
    expect(outcome.roles).toEqual([{ id: AUTHOR, name: 'Author' }]);
    expect(outcome.wouldApplyTagIds).toEqual(['domainNl']);
    expect(patches).toHaveLength(0);
  });

  it('separates a deleted tag from one whose group is not enabled', async () => {
    const { outcome, lines } = await run(base(), { dryRun: true, simulateRoleId: AUTHOR });
    expect(outcome.droppedTagIds).toEqual([
      { id: 'brandAcme', why: 'not-in-enabled-group' },
      { id: 'deletedTag', why: 'tag-deleted' },
    ]);
    expect(lines.some((l) => l.includes('deletedTag (deletedTag) — no longer exists'))).toBe(true);
  });

  it('runs with no entry at all, and then reads none', async () => {
    const { outcome, pageRequests } = await run(base(), { dryRun: true, simulateRoleId: EDITOR }, null);
    expect(pageRequests.entryGet).toBe(0);
    expect(outcome.entryId).toBe('');
    expect(outcome.wouldApplyTagIds).toEqual(['domainBe']);
  });

  it('names a role that does not exist in the space', async () => {
    const { outcome } = await run(base(), { dryRun: true, simulateRoleId: 'gone' });
    expect(outcome.reason).toBe('role gone does not exist in space space');
  });

  it('is refused by the engine on a real run, as a second line of defence', async () => {
    await expect(run(base(), { dryRun: false, simulateRoleId: AUTHOR })).rejects.toThrow(/only allowed on a dry run/);
  });
});

describe('logged lines are what the tab shows', () => {
  it('every line the engine logs reaches the injected log, including the reason', async () => {
    const { outcome, lines } = await run(base(), { dryRun: true, simulateRoleId: EDITOR });
    expect(lines[0]).toBe('[autoTagByRole] dry run — nothing will be written');
    expect(lines).toContain("[autoTagByRole] simulating role Editor (role-editor) instead of the entry's creator");
    expect(lines.at(-1)).toBe('[autoTagByRole] dry run — would add: Domain: Belgium (domainBe)');
    expect(outcome.reason).toBeUndefined();
  });
});

describe('readRunOptions', () => {
  it.each([
    [{}, { dryRun: false }],
    [{ dryRun: true }, { dryRun: true }],
    [{ dryRun: 'true' }, { dryRun: true }],
    [{ dryRun: 'yes' }, { dryRun: false }],
    [
      { dryRun: true, simulateRoleId: ' role-1 ' },
      { dryRun: true, simulateRoleId: 'role-1' },
    ],
    [{ dryRun: true, simulateRoleId: '' }, { dryRun: true }],
  ])('reads %j', (body, expected) => {
    expect(readRunOptions(body)).toEqual(expected);
  });

  it('refuses a simulated role on a real run', () => {
    expect(() => readRunOptions({ simulateRoleId: 'role-1' })).toThrow(/only allowed on a dry run/);
  });

  it('refuses a malformed role ID', () => {
    expect(() => readRunOptions({ dryRun: true, simulateRoleId: '../x' })).toThrow(/must be a Contentful role ID/);
  });
});

describe('readOptionalEntryId', () => {
  it('lets a simulated run leave the entry out', () => {
    expect(readOptionalEntryId({}, { dryRun: true, simulateRoleId: 'r' })).toBeUndefined();
  });

  it('still validates an entry ID a simulated run does pass', () => {
    expect(() => readOptionalEntryId({ entryId: '../x' }, { dryRun: true, simulateRoleId: 'r' })).toThrow(/entryId/);
  });

  it('requires one on any other run', () => {
    expect(() => readOptionalEntryId({}, { dryRun: true })).toThrow(/entryId/);
  });
});
