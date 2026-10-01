import { useState } from 'react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Button, Flex, FormControl, List, ListItem, Note, Paragraph, Select, Text, TextLink } from '@contentful/f36-components';
import type { AutoTagOutcome } from '../lib/autoTag';
import { describeError } from '../lib/errors';

interface RoleItem {
  id: string;
  name: string;
}

interface TagItem {
  id: string;
  name: string;
}

type CallResult = { kind: 'succeeded'; outcome: AutoTagOutcome; log: string[] } | { kind: 'failed'; message: string; log: string[] };

interface PickedEntry {
  id: string;
  title: string;
}

/**
 * The tagging action's own ID. It is generated rather than equal to the manifest ID, so it is looked
 * up, and the environment listing is used because it works for an install in any organization.
 */
async function resolveActionId(sdk: ConfigAppSDK): Promise<string> {
  const actions = await sdk.cma.appAction.getManyForEnvironment({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });
  const ours = actions.items.filter((a) => a.sys.appDefinition?.sys.id === sdk.ids.app);
  if (ours.length === 0) {
    throw new Error("This app's “Auto-tag by Role” action is not registered in this environment.");
  }
  return ours[0].sys.id;
}

function entryTitle(entry: { sys: { id: string }; fields?: Record<string, Record<string, unknown>> }, locale: string) {
  for (const value of Object.values(entry.fields ?? {})) {
    const text = value?.[locale];
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return entry.sys.id;
}

/**
 * Runs the same App Action the Automation calls, as a dry run, for a role the admin picks. A
 * Marketplace customer cannot read this app's function logs, so this tab shows what they would say.
 */
export default function Troubleshooting({
  sdk,
  roles,
  tags,
  savedMapping,
  hasUnsavedChanges,
}: {
  sdk: ConfigAppSDK;
  roles: RoleItem[];
  tags: TagItem[];
  /** The SAVED role → tag mapping. The action runs on what is saved, not on what is on screen. */
  savedMapping: Record<string, string[]>;
  hasUnsavedChanges: boolean;
}) {
  const [roleId, setRoleId] = useState('');
  const [entry, setEntry] = useState<PickedEntry | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);

  const tagName = (id: string) => tags.find((t) => t.id === id)?.name ?? id;
  const roleName = roles.find((r) => r.id === roleId)?.name;

  async function pickEntry() {
    const picked = await sdk.dialogs.selectSingleEntry<{
      sys: { id: string };
      fields?: Record<string, Record<string, unknown>>;
    }>();
    // `null` is a cancel, not a choice: keep whatever was picked before.
    if (!picked) return;
    setEntry({ id: picked.sys.id, title: entryTitle(picked, sdk.locales.default) });
    setResult(null);
  }

  async function runTest() {
    setRunning(true);
    setResult(null);
    try {
      const appActionId = await resolveActionId(sdk);
      const call = await sdk.cma.appActionCall.createWithResult(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId,
        },
        {
          parameters: {
            dryRun: true,
            simulateRoleId: roleId,
            ...(entry ? { entryId: entry.id } : {}),
          },
        }
      );
      // The call's status, result and error sit under `sys`, not at the top level.
      const done = (
        call as unknown as {
          sys: {
            status: 'succeeded' | 'failed' | 'processing';
            result?: AutoTagOutcome & { log?: string[]; failed?: boolean; error?: string };
            error?: { message: string; details?: unknown };
          };
        }
      ).sys;
      if (done.status === 'succeeded' && done.result?.failed) {
        // The function caught the error and returned it, which is the only way its message survives.
        setResult({ kind: 'failed', message: done.result.error ?? 'Unknown error', log: done.result.log ?? [] });
      } else if (done.status === 'succeeded' && done.result) {
        const { log = [], ...outcome } = done.result;
        setResult({ kind: 'succeeded', outcome, log });
      } else if (done.status === 'failed') {
        // The function crashed before it could report anything, so only Contentful's summary exists.
        const details = typeof done.error?.details === 'string' ? ` ${done.error.details}` : '';
        setResult({ kind: 'failed', message: `${done.error?.message ?? 'The action failed.'}${details}`, log: [] });
      } else {
        setResult({ kind: 'failed', message: 'The action did not finish in time. Try again.', log: [] });
      }
    } catch (err) {
      setResult({ kind: 'failed', message: describeError(err), log: [] });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Flex flexDirection="column" gap="spacingL" marginTop="spacingL">
      <Paragraph marginBottom="none">
        Choose a role to see which tags an entry created by someone with that role would receive. This runs the same action as your Automation, with the saved
        configuration, and writes nothing.
      </Paragraph>

      {hasUnsavedChanges && (
        <Note variant="warning" title="You have unsaved changes">
          Tests use the saved configuration. Save first to test these changes.
        </Note>
      )}

      <FormControl id="troubleshoot-role" isRequired marginBottom="none">
        <FormControl.Label>Role</FormControl.Label>
        <Select
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            setResult(null);
          }}>
          <Select.Option value="" isDisabled>
            Choose a role…
          </Select.Option>
          {roles.map((r) => {
            const count = savedMapping[r.id]?.length ?? 0;
            return (
              <Select.Option key={r.id} value={r.id}>
                {r.name} ({count === 0 ? 'no tags mapped' : `${count} tag${count === 1 ? '' : 's'} mapped`})
              </Select.Option>
            );
          })}
        </Select>
      </FormControl>

      <FormControl id="troubleshoot-entry" marginBottom="none">
        <FormControl.Label>Entry (optional)</FormControl.Label>
        <Flex alignItems="center" gap="spacingS">
          {entry ? (
            <>
              <Text>
                {entry.title}{' '}
                <Text fontColor="gray500" as="span">
                  ({entry.id})
                </Text>
              </Text>
              <TextLink as="button" onClick={pickEntry}>
                Change
              </TextLink>
              <TextLink
                as="button"
                variant="negative"
                onClick={() => {
                  setEntry(null);
                  setResult(null);
                }}>
                Clear
              </TextLink>
            </>
          ) : (
            <Button size="small" onClick={pickEntry}>
              Pick an entry
            </Button>
          )}
        </Flex>
        <FormControl.HelpText>
          With an entry, the result also shows which tags it already has. Its creator is ignored: the role above is used instead.
        </FormControl.HelpText>
      </FormControl>

      <Box>
        <Button variant="primary" onClick={runTest} isDisabled={!roleId || running} isLoading={running}>
          Run test
        </Button>
      </Box>

      {result && <ResultView result={result} roleName={roleName ?? roleId} tagName={tagName} />}
    </Flex>
  );
}

function ResultView({ result, roleName, tagName }: { result: CallResult; roleName: string; tagName: (id: string) => string }) {
  if (result.kind === 'failed') {
    return (
      <Flex flexDirection="column" gap="spacingM">
        <Note variant="negative" title="The action failed">
          {result.message}
        </Note>
        <LogBox lines={result.log.length > 0 ? result.log : [result.message]} />
      </Flex>
    );
  }

  const { outcome, log } = result;
  const wouldAdd = outcome.wouldApplyTagIds ?? [];
  const already = outcome.skippedTagIds ?? [];
  const dropped = outcome.droppedTagIds ?? [];

  return (
    <Flex flexDirection="column" gap="spacingM">
      {wouldAdd.length > 0 ? (
        <Note variant="positive" title={`These tags would be added for ${roleName}`}>
          {wouldAdd.map(tagName).join(', ')}
        </Note>
      ) : (
        <Note variant="neutral" title="Nothing would change">
          {outcome.reason ?? 'No tags would be added.'}
        </Note>
      )}

      {(already.length > 0 || dropped.length > 0) && (
        <List>
          {already.map((id) => (
            <ListItem key={`a-${id}`}>{tagName(id)}: already on the entry</ListItem>
          ))}
          {dropped.map((d) => (
            <ListItem key={`d-${d.id}`}>
              {tagName(d.id)}:{' '}
              {d.why === 'tag-deleted'
                ? 'mapped, but the tag no longer exists in this space. Remove it from the mapping.'
                : 'mapped, but its tag group is not enabled. Enable the group on the Configuration tab.'}
            </ListItem>
          ))}
        </List>
      )}

      <LogBox lines={log} />
    </Flex>
  );
}

function LogBox({ lines }: { lines: string[] }) {
  return (
    <Box>
      <Text fontWeight="fontWeightDemiBold">What the function logged</Text>
      <Box
        as="pre"
        marginTop="spacingXs"
        padding="spacingS"
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: 12,
          background: 'var(--gray-100, #F7F9FA)',
          borderRadius: 4,
          margin: 0,
        }}>
        {lines.length > 0 ? lines.join('\n') : '(nothing logged)'}
      </Box>
    </Box>
  );
}
