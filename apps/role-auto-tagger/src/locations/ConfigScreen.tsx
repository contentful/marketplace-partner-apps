import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Accordion,
  Box,
  AccordionItem,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Pagination,
  Paragraph,
  Skeleton,
  Switch,
  Tabs,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { getAll, groupOf, parseJsonParam } from '../lib/autoTag';
import { describeError } from '../lib/errors';
import Troubleshooting from '../components/Troubleshooting';

export interface AppInstallationParameters {
  enabledTagGroups: string[];
  roleTagMapping: Record<string, string[]>; // roleId -> tagId[]
  cmaToken: string; // personal access token used by the auto-tag function
}

// Contentful app definition parameters only support Symbol/Boolean/Number/Enum/Secret types —
// no List or Object. Arrays and objects are JSON strings at the boundary.
function serializeParams(
  p: Pick<AppInstallationParameters, 'enabledTagGroups' | 'roleTagMapping'> & { cmaToken?: string }
): Record<string, string | undefined> {
  return {
    enabledTagGroups: JSON.stringify(p.enabledTagGroups),
    roleTagMapping: JSON.stringify(p.roleTagMapping),
    cmaToken: p.cmaToken || undefined,
  };
}

interface RoleItem {
  id: string;
  name: string;
}

interface TagItem {
  id: string;
  name: string;
  group: string;
}

const TAGS_PER_PAGE = 20;

/**
 * One role's tag checkboxes. A space can hold hundreds of tags, so the list is searchable and paged
 * rather than rendered whole; the count in the heading always covers every page.
 */
function RoleTagPicker({ role, tags, mappedTagIds, onToggle }: { role: RoleItem; tags: TagItem[]; mappedTagIds: string[]; onToggle: (tagId: string) => void }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;
  }, [tags, query]);

  // Tags can disappear from under the current page when a group is disabled or the search narrows.
  const lastPage = Math.max(0, Math.ceil(filtered.length / TAGS_PER_PAGE) - 1);
  const activePage = Math.min(page, lastPage);
  const visible = filtered.slice(activePage * TAGS_PER_PAGE, (activePage + 1) * TAGS_PER_PAGE);

  return (
    <Flex flexDirection="column" gap="spacingS" paddingTop="spacingXs">
      {tags.length > TAGS_PER_PAGE && (
        <TextInput
          size="small"
          placeholder={`Search ${tags.length} tags…`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          aria-label={`Search tags for ${role.name}`}
        />
      )}
      {visible.length === 0 ? (
        <Text fontColor="gray500">No tags match “{query}”.</Text>
      ) : (
        <Flex flexDirection="column" gap="spacingXs">
          {visible.map((tag) => (
            <Checkbox key={tag.id} id={`role-${role.id}--tag-${tag.id}`} isChecked={mappedTagIds.includes(tag.id)} onChange={() => onToggle(tag.id)}>
              {tag.name}
            </Checkbox>
          ))}
        </Flex>
      )}
      {filtered.length > TAGS_PER_PAGE && (
        <Pagination
          activePage={activePage}
          itemsPerPage={TAGS_PER_PAGE}
          totalItems={filtered.length}
          isLastPage={activePage === lastPage}
          onPageChange={setPage}
        />
      )}
    </Flex>
  );
}

export default function ConfigScreen() {
  const sdk = useSDK<ConfigAppSDK>();

  const [enabledTagGroups, setEnabledTagGroups] = useState<string[]>([]);
  const [roleTagMapping, setRoleTagMapping] = useState<Record<string, string[]>>({});
  const [cmaToken, setCmaToken] = useState<string>('');
  const [cmaTokenSaved, setCmaTokenSaved] = useState<boolean>(false);
  const [tagGroups, setTagGroups] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // What is stored on the installation. The action runs on this, not on what is on screen, so the
  // Troubleshooting tab tests it and flags any difference. A new token never counts: it is a Secret.
  const [saved, setSaved] = useState({ enabledTagGroups: [] as string[], roleTagMapping: {} as Record<string, string[]> });

  // ── onConfigure ──────────────────────────────────────────────────────────────
  // Use a ref so the handler registered with the SDK always calls the latest closure,
  // avoiding stale state when the user clicks Save after async initial load completes.

  const onConfigureRef = useRef<Parameters<typeof sdk.app.onConfigure>[0]>(() => Promise.resolve(false));

  onConfigureRef.current = useCallback(async () => {
    return {
      parameters: serializeParams({ enabledTagGroups, roleTagMapping, cmaToken }),
      // The app renders in no entry location any more. An empty map removes it from every content
      // type's sidebar and entry editor where an earlier version assigned it, since Contentful
      // re-applies targetState on every save and drops the widget from any content type not listed.
      targetState: { EditorInterface: {} },
    };
  }, [enabledTagGroups, roleTagMapping, cmaToken]);

  // Read back what was stored after a successful save, so the Troubleshooting tab knows what the
  // action now runs on and the token field returns to "already set".
  useEffect(() => {
    sdk.app.onConfigurationCompleted(async (err) => {
      if (err) return;
      const raw = (await sdk.app.getParameters()) as Record<string, unknown> | null;
      setSaved({
        enabledTagGroups: parseJsonParam<string[]>(raw?.enabledTagGroups, []),
        roleTagMapping: parseJsonParam<Record<string, string[]>>(raw?.roleTagMapping, {}),
      });
      if (typeof raw?.cmaToken === 'string' && /^\*+$/.test(raw.cmaToken)) {
        setCmaToken('');
        setCmaTokenSaved(true);
      }
    });
  }, [sdk]);

  // Register once — the ref ensures we always invoke the latest closure.
  useEffect(() => {
    sdk.app.onConfigure(() => onConfigureRef.current());
  }, [sdk]);

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const spaceId = sdk.ids.space;
        const environmentId = sdk.ids.environment;
        // Every page, not just the first: a space with more tags or roles than one page holds would
        // otherwise show an incomplete list and silently make the rest unmappable.
        const [currentParameters, tags, roleItems] = await Promise.all([
          sdk.app.getParameters<AppInstallationParameters>(),
          getAll((query) => sdk.cma.tag.getMany({ spaceId, environmentId, query })),
          getAll((query) => sdk.cma.role.getMany({ spaceId, query })),
        ]);

        const parsedTags = tags
          .flatMap((t) => {
            const group = groupOf(t.name);
            return group ? [{ id: t.sys.id, name: t.name, group }] : [];
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllTags(parsedTags);
        setTagGroups(Array.from(new Set(parsedTags.map((t) => t.group))).sort());
        setRoles(roleItems.map((r) => ({ id: r.sys.id, name: r.name })));

        const raw = currentParameters as unknown as Record<string, unknown> | null;
        const loaded = {
          enabledTagGroups: parseJsonParam<string[]>(raw?.enabledTagGroups, []),
          roleTagMapping: parseJsonParam<Record<string, string[]>>(raw?.roleTagMapping, {}),
        };
        setEnabledTagGroups(loaded.enabledTagGroups);
        setRoleTagMapping(loaded.roleTagMapping);
        setSaved(loaded);
        // Contentful returns a stored Secret as a string of asterisks, never the value itself.
        const rawToken = raw?.cmaToken;
        if (typeof rawToken === 'string' && /^\*+$/.test(rawToken)) {
          setCmaTokenSaved(true);
        }
      } catch (err) {
        setLoadError(describeError(err));
        console.error('[ConfigScreen] load failed', err);
      } finally {
        setLoading(false);
        sdk.app.setReady();
      }
    })();
  }, [sdk]);

  // ── Config toggles ────────────────────────────────────────────────────────────

  function toggleTagGroup(group: string) {
    setEnabledTagGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function toggleRoleTag(roleId: string, tagId: string) {
    setRoleTagMapping((prev) => {
      const current = prev[roleId] ?? [];
      const updated = current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId];
      return { ...prev, [roleId]: updated };
    });
  }

  const eligibleTags = useMemo(() => allTags.filter((t) => enabledTagGroups.includes(t.group)), [allTags, enabledTagGroups]);

  const hasUnsavedChanges =
    cmaToken !== '' ||
    serializeParams({ enabledTagGroups, roleTagMapping }).enabledTagGroups !== serializeParams(saved).enabledTagGroups ||
    serializeParams({ enabledTagGroups, roleTagMapping }).roleTagMapping !== serializeParams(saved).roleTagMapping;

  // Only tags in an enabled group would be applied, so that is what the role list counts.
  const savedApplicableMapping = useMemo(() => {
    const applicable = new Set(allTags.filter((t) => saved.enabledTagGroups.includes(t.group)).map((t) => t.id));
    return Object.fromEntries(Object.entries(saved.roleTagMapping).map(([role, ids]) => [role, ids.filter((id) => applicable.has(id))]));
  }, [allTags, saved]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Flex flexDirection="column" margin="spacingXl" style={{ maxWidth: 640 }}>
      <Heading>Role auto tagger</Heading>
      <Paragraph>
        Tags a new entry automatically based on the roles of the user who created it. Choose which tag groups may be applied, then which tags each role
        receives.
      </Paragraph>

      {loadError && (
        <Note variant="negative" title="Could not load this space's tags and roles" style={{ marginBottom: 16 }}>
          {loadError}
        </Note>
      )}

      <Note variant="neutral" title="Tagging runs from an Automation" style={{ marginBottom: 24 }}>
        Saving this screen does not start tagging on its own. Create a Contentful Automation that runs on entry creation and calls this app's “Auto-tag by Role”
        action with the new entry's ID. The README describes the steps.
      </Note>

      <Tabs defaultTab="configuration">
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="configuration">Configuration</Tabs.Tab>
          <Tabs.Tab panelId="troubleshooting">Troubleshooting</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="configuration">
          <Box marginTop="spacingL">
            <Form>
              {/* CMA token for auto-tag function */}
              <FormControl id="cma-token" marginBottom="spacingL">
                <FormControl.Label>CMA token (user role look-up)</FormControl.Label>
                <TextInput
                  type="password"
                  autoComplete="off"
                  value={cmaToken}
                  onChange={(e) => {
                    setCmaToken(e.target.value);
                    setCmaTokenSaved(false);
                  }}
                  placeholder={cmaTokenSaved ? 'Already set — enter a new value to replace it' : 'CFPAT-…'}
                />
                <FormControl.HelpText>
                  Used only to read this space's members and roles, which an app cannot read on its own. It needs no write access. Stored as an encrypted
                  secret; leave blank to keep the existing token.
                </FormControl.HelpText>
              </FormControl>

              {/* Global tag groups */}
              <FormControl marginBottom="spacingL">
                <FormControl.Label>Tag groups</FormControl.Label>
                {loading ? (
                  <Flex flexDirection="column" gap="spacingS">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton.Container key={i}>
                        <Skeleton.BodyText numberOfLines={1} />
                      </Skeleton.Container>
                    ))}
                  </Flex>
                ) : tagGroups.length === 0 ? (
                  <Text fontColor="gray500">No grouped tags found (expected format: "Group: value").</Text>
                ) : (
                  <Flex flexDirection="column" gap="spacingXs">
                    {tagGroups.map((group) => (
                      <Switch key={group} id={`global--${group}`} isChecked={enabledTagGroups.includes(group)} onChange={() => toggleTagGroup(group)}>
                        {group}
                      </Switch>
                    ))}
                  </Flex>
                )}
                <FormControl.HelpText>Only tags from enabled groups can be mapped to a role or applied automatically.</FormControl.HelpText>
              </FormControl>

              {/* Role auto-tagging */}
              <FormControl marginBottom="spacingL">
                <FormControl.Label>Role auto-tagging</FormControl.Label>
                {loading ? (
                  <Flex flexDirection="column" gap="spacingS">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton.Container key={i}>
                        <Skeleton.BodyText numberOfLines={2} />
                      </Skeleton.Container>
                    ))}
                  </Flex>
                ) : roles.length === 0 ? (
                  <Text fontColor="gray500">No roles found in this space.</Text>
                ) : enabledTagGroups.length === 0 ? (
                  <Text fontColor="gray500">Enable at least one tag group above to configure auto-tagging.</Text>
                ) : (
                  <Accordion>
                    {roles.map((role) => {
                      const mappedTagIds = roleTagMapping[role.id] ?? [];
                      const checkedCount = eligibleTags.filter((t) => mappedTagIds.includes(t.id)).length;
                      return (
                        <AccordionItem key={role.id} title={`${role.name}${checkedCount > 0 ? ` (${checkedCount} tag${checkedCount !== 1 ? 's' : ''})` : ''}`}>
                          <RoleTagPicker role={role} tags={eligibleTags} mappedTagIds={mappedTagIds} onToggle={(tagId) => toggleRoleTag(role.id, tagId)} />
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
                <FormControl.HelpText>
                  When an entry is created, the tags mapped to its creator's roles are added. This works the same whether the user was added to the space
                  directly or through a team. Space admins hold no roles, so no mapping applies to them.
                </FormControl.HelpText>
              </FormControl>
            </Form>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel id="troubleshooting">
          {loading ? (
            <Box marginTop="spacingL">
              <Skeleton.Container>
                <Skeleton.BodyText numberOfLines={3} />
              </Skeleton.Container>
            </Box>
          ) : (
            <Troubleshooting sdk={sdk} roles={roles} tags={allTags} savedMapping={savedApplicableMapping} hasUnsavedChanges={hasUnsavedChanges} />
          )}
        </Tabs.Panel>
      </Tabs>
    </Flex>
  );
}
