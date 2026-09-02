import { SidebarAppSDK, SerializedJSONValue } from '@contentful/app-sdk';
import { Button, Note, Spinner, Stack, Text } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/react';
import { useCallback, useEffect, useState } from 'react';
import logo from '../assets/logo.svg';
import { AppInstallationParameters, CloudinaryAsset, MediaLibraryResultAsset } from '../types';
import { extractAsset } from '../utils';

const styles = {
  logo: css({
    display: 'block',
    width: '16px',
    height: '16px',
    filter: 'brightness(0) invert(1)',
  }),
  wrapper: css({
    marginTop: '-8px',
  }),
};

/** One picker slot = one (field, locale) pair */
export interface PickerSlot {
  slotKey: string; // `${fieldId}::${locale}`
  fieldId: string;
  fieldName: string;
  locale: string;
  localeName: string;
  maxFiles: number;
}

/** Result the dialog returns */
interface MultiFieldResult {
  mode: 'multi-field';
  assignments: Record<string, MediaLibraryResultAsset[]>; // keyed by slotKey
}

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();
  useAutoResizer({ absoluteElements: true });

  const [slots, setSlots] = useState<PickerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const contentTypeId = sdk.entry.getSys().contentType.sys.id;
        const [ei, ct] = await Promise.all([
          sdk.cma.editorInterface.get({ contentTypeId }),
          sdk.cma.contentType.get({ contentTypeId }),
        ]);

        const appFieldIds = new Set(
          (ei.controls ?? [])
            .filter((c) => c.widgetNamespace === 'app' && c.widgetId === sdk.ids.app)
            .map((c) => c.fieldId)
            .filter((id): id is string => typeof id === 'string'),
        );

        const installMaxFiles = sdk.parameters.installation.maxFiles ?? 10;
        const localeNames: Record<string, string> = sdk.locales.names;
        const defaultLocale = sdk.locales.default;

        // Use only the locales the editor has active, not all space locales.
        const { active } = sdk.editor.getLocaleSettings();
        const activeLocales = active && active.length > 0 ? active : [defaultLocale];

        const built: PickerSlot[] = [];
        for (const f of ct.fields) {
          if (!appFieldIds.has(f.id)) continue;
          const locales = f.localized ? activeLocales : [defaultLocale];
          for (const locale of locales) {
            built.push({
              slotKey: `${f.id}::${locale}`,
              fieldId: f.id,
              fieldName: f.name,
              locale,
              localeName: localeNames[locale] ?? locale,
              maxFiles: installMaxFiles,
            });
          }
        }

        setSlots(built);
      } catch (e) {
        setError('Could not load Cloudinary fields.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sdk]);

  const openMultiPicker = useCallback(async () => {
    setPicking(true);
    setError(null);

    try {
      const parameters: SerializedJSONValue = {
        mode: 'multi-field',
        slots: slots.map((s) => ({
          slotKey: s.slotKey,
          fieldId: s.fieldId,
          fieldName: s.fieldName,
          locale: s.locale,
          localeName: s.localeName,
          maxFiles: s.maxFiles,
        })),
      };

      const result: MultiFieldResult | undefined = await sdk.dialogs.openCurrentApp({
        position: 'center',
        title: 'Select Cloudinary assets',
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        width: 1400,
        parameters,
      });

      if (!result) return;

      for (const slot of slots) {
        const rawAssets = result.assignments[slot.slotKey];
        if (!rawAssets || rawAssets.length === 0) continue;

        const newAssets: CloudinaryAsset[] = rawAssets.map(extractAsset);
        const entryField = sdk.entry.fields[slot.fieldId];
        if (!entryField) continue;

        const existing: CloudinaryAsset[] = entryField.getValue(slot.locale) ?? [];
        const merged = [...existing, ...newAssets].slice(0, slot.maxFiles);
        await entryField.setValue(merged, slot.locale);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to pick assets.';
      setError(msg);
      sdk.notifier.error(msg);
    } finally {
      setPicking(false);
    }
  }, [sdk, slots]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing="spacingS">
        <Spinner size="small" />
        <Text fontSize="fontSizeS">Loading fields…</Text>
      </Stack>
    );
  }

  if (error) {
    return <Note variant="negative">{error}</Note>;
  }

  if (slots.length === 0) {
    return <Note variant="neutral">No Cloudinary fields found in this content type.</Note>;
  }

  const fieldCount = new Set(slots.map((s) => s.fieldId)).size;
  const localeCount = new Set(slots.map((s) => s.locale)).size;

  return (
    <div css={styles.wrapper}>
      <Stack flexDirection="column" spacing="spacingS">
        <Text fontSize="fontSizeS" fontColor="gray600">
          Open Cloudinary once and assign assets to {fieldCount} field{fieldCount !== 1 ? 's' : ''}, {localeCount} locale{localeCount !== 1 ? 's' : ''}.
        </Text>
        <Button
          startIcon={picking ? <Spinner size="small" /> : <img src={logo} alt="Cloudinary" css={styles.logo} />}
          variant="primary"
          size="small"
          isFullWidth
          isDisabled={picking}
          onClick={openMultiPicker}>
          {picking ? 'Opening…' : 'Open Cloudinary'}
        </Button>
      </Stack>
    </div>
  );
};

export default Sidebar;
