import { useEffect, useState, useCallback } from 'react';
import type { EditorAppSDK } from '@contentful/app-sdk';
import type { EntryReference } from '@/types';

type EntryType = { id: string; name: string };

type Params = {
  sdk: EditorAppSDK;
  entries: EntryType[];
  env: { id: string; name: string };
  selectedCampaign: { id: string; name: string } | null;
  selectedProject: { id: string; name: string } | null;
};

export const useEntrySummaries = ({ sdk, entries, env, selectedCampaign, selectedProject }: Params) => {
  const [metaMap, setMetaMap] = useState<Record<string, string>>(
    (sdk.entry.fields['meta']?.getValue() as Record<string, string>) || {}
  );

  const [entrySummaries, setEntrySummaries] = useState<
    Record<string, { id: string; contentTypeId?: string; contentTypeName?: string; entryName?: string }>
  >({});

  const loadEntrySummary = useCallback(async (entryId: string) => {
    try {
      const entry = await sdk.cma.entry.get({ entryId }) as EntryReference & { fields?: { name?: Record<string, string> } };
      const contentTypeId: string | undefined = entry?.sys?.contentType?.sys?.id;
      const entryName: string | undefined = entry?.fields?.name?.[sdk.locales.default];
      const contentTypeName = entries.find((ct) => ct.id === contentTypeId)?.name || contentTypeId || undefined;
      setEntrySummaries((prev) => ({
        ...prev,
        [entryId]: { id: entryId, contentTypeId, contentTypeName, entryName },
      }));
    } catch (err) {
      console.error(`Failed to load entry summary for ${entryId}:`, err);
      setEntrySummaries((prev) => ({
        ...prev,
        [entryId]: { id: entryId },
      }));
    }
  }, [sdk.cma.entry, sdk.locales.default, entries]);

  useEffect(() => {
    const field = sdk.entry.fields['meta'];
    const preload = (map: Record<string, string> | undefined | null) => {
      Object.values(map || {}).forEach((entryId) => {
        if (entryId && !entrySummaries[entryId]) {
          void loadEntrySummary(entryId);
        }
      });
    };

    const detach = field?.onValueChanged?.((next: Record<string, string>) => {
      const nextMap = next || {};
      setMetaMap(nextMap);
      preload(nextMap);
    });

    try {
      const initial = field?.getValue?.() as Record<string, string> | undefined;
      preload(initial);
    } catch (err) {
      console.error('Failed to get initial meta field value:', err);
    }

    return () => {
      if (typeof detach === 'function') detach();
    };
  }, [sdk.entry.fields, loadEntrySummary, entrySummaries]);

  const handleOpenLinkedEntry = async (entryId: string) => {
    try {
      await sdk.navigator.openEntry(entryId, { slideIn: true });
    } catch (err) {
      console.error(`Failed to open entry ${entryId}:`, err);
      sdk.notifier.error('Failed to open entry');
    }
  };

  const cleanVariationsField = (meta: Record<string, string>) => {
    const metaEntryIds = Object.values(meta);
    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const cleaned = currentVariations.filter((v: EntryReference) => metaEntryIds.includes(v.sys?.id));
    sdk.entry.fields['variations']?.setValue(cleaned);
  };

  const pushLinkToVariations = (entryId: string) => {
    const newLink = { sys: { type: 'Link', linkType: 'Entry', id: entryId } };
    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const filtered = currentVariations.filter((v: EntryReference) => v.sys?.id !== entryId);
    sdk.entry.fields['variations']?.setValue([...filtered, newLink]);
  };

  const setExperimentContext = () => {
    if (selectedCampaign && selectedProject) {
      sdk.entry.fields['experimentID']?.setValue(selectedCampaign.id);
      sdk.entry.fields['projectId']?.setValue(selectedProject.id);
      sdk.entry.fields['experimentName']?.setValue(`${selectedCampaign.name}`);
    }
    sdk.entry.fields['environmentId']?.setValue(env.id);
    sdk.entry.fields['environment']?.setValue(env.name);
  };

  const handleUnlinkEntryForVariation = (variationKey: string) => {
    const currentMeta = (sdk.entry.fields['meta']?.getValue() as Record<string, string>) || {};
    const entryId = currentMeta[variationKey];
    if (!entryId) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [variationKey]: _removed, ...rest } = currentMeta;
    sdk.entry.fields['meta']?.setValue(rest);

    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const cleaned = currentVariations.filter((v: EntryReference) => v.sys?.id !== entryId);
    sdk.entry.fields['variations']?.setValue(cleaned);

    sdk.notifier.success('Link removed for this variation');
  };

  return {
    metaMap,
    entrySummaries,
    handleOpenLinkedEntry,
    handleUnlinkEntryForVariation,
    setExperimentContext,
    pushLinkToVariations,
    cleanVariationsField,
  };
};
