import { useEffect, useState } from 'react';
import type { EditorAppSDK } from '@contentful/app-sdk';

type EntryType = { id: string; name: string };

type Variation = { id: string; name: string; allocation: number };

type Params = {
  sdk: EditorAppSDK;
  entries: EntryType[];
  env: { id: string; name: string };
  selectedCampaign: { id: string; name: string } | null;
  selectedProject: { id: string; name: string } | null;
  variations?: Variation[];
};

export const useEntrySummaries = ({ sdk, entries, env, selectedCampaign, selectedProject }: Params) => {
  const [metaMap, setMetaMap] = useState<Record<string, string>>(
    (sdk.entry.fields['meta']?.getValue() as Record<string, string>) || {}
  );

  const [entrySummaries, setEntrySummaries] = useState<
    Record<string, { id: string; contentTypeId?: string; contentTypeName?: string; entryName?: string }>
  >({});

  const loadEntrySummary = async (entryId: string) => {
    try {
      const entry: any = await sdk.cma.entry.get({ entryId });
      const contentTypeId: string | undefined = entry?.sys?.contentType?.sys?.id;
      const entryName: string | undefined = entry?.fields?.name?.[sdk.locales.default];
      const contentTypeName = entries.find((ct) => ct.id === contentTypeId)?.name || contentTypeId || undefined;
      setEntrySummaries((prev) => ({
        ...prev,
        [entryId]: { id: entryId, contentTypeId, contentTypeName, entryName },
      }));
    } catch {
      setEntrySummaries((prev) => ({
        ...prev,
        [entryId]: { id: entryId },
      }));
    }
  };

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
    } catch {
      // no-op
    }

    return () => {
      if (typeof detach === 'function') detach();
    };
  }, [sdk, entries, sdk.entry.fields]);

  const handleOpenLinkedEntry = async (entryId: string) => {
    try {
      await sdk.navigator.openEntry(entryId, { slideIn: true });
    } catch {
      // no-op
    }
  };

  const cleanVariationsField = (meta: Record<string, string>) => {
    const metaEntryIds = Object.values(meta);
    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const cleaned = currentVariations.filter((v: any) => metaEntryIds.includes(v.sys?.id));
    sdk.entry.fields['variations']?.setValue(cleaned);
  };

  const pushLinkToVariations = (entryId: string) => {
    const newLink = { sys: { type: 'Link', linkType: 'Entry', id: entryId } };
    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const filtered = currentVariations.filter((v: any) => v.sys?.id !== entryId);
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

    const { [variationKey]: _removed, ...rest } = currentMeta;
    sdk.entry.fields['meta']?.setValue(rest);

    const currentVariations = sdk.entry.fields['variations']?.getValue() || [];
    const cleaned = currentVariations.filter((v: any) => v.sys?.id !== entryId);
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
