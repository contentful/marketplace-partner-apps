import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Menu } from '@contentful/f36-components';
import { ArrowDownIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { useCallback, useRef, useState } from 'react';
import { APP_ENV, APP_VERSION } from '../constants';
import { AppInstallationParameters, MediaLibraryResult, MediaLibraryResultAsset } from '../types';
import { loadScript } from '../utils';
import { PickerSlot } from './Sidebar';
import { ShowOptions } from './types';

const styles = {
  container: css({
    height: '100%',
  }),
  toolbar: css({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'white',
    borderTop: '1px solid #e5ebed',
    zIndex: 10,
  }),
  toolbarLabel: css({
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    color: '#536171',
    flexShrink: 0,
  }),
  dot: css({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#0059C8',
    flexShrink: 0,
  }),
  dotPlaceholder: css({
    display: 'inline-block',
    width: '8px',
    flexShrink: 0,
  }),
  menuItemInner: css({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
  actions: css({
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
    flexShrink: 0,
  }),
};

// ─── Single-field mode (original behaviour) ───────────────────────────────────

interface SingleFieldProps {
  sdk: DialogAppSDK<AppInstallationParameters>;
  invocationParams: Record<string, unknown>;
}

const SingleFieldDialog = ({ sdk, invocationParams }: SingleFieldProps) => {
  const expression = invocationParams.expression as string | undefined;

  const init = useCallback(
    (container: HTMLDivElement) => {
      if (!container) return;
      (async () => {
        await loadScript('https://media-library.cloudinary.com/global/all.js');
        container.innerHTML = '';
        injectGlobal({
          'html, body, #root': { padding: 0, margin: 0, border: 0, height: '100%', overflow: 'hidden' },
        });

        const configurationParams = sdk.parameters.installation;
        const maxFiles =
          'maxFiles' in invocationParams ? Number(invocationParams.maxFiles) : configurationParams.maxFiles;
        const transformations = [];
        if (configurationParams.format !== 'none') transformations.push({ fetch_format: configurationParams.format });
        if (configurationParams.quality !== 'none') transformations.push({ quality: configurationParams.quality });

        sdk.window.updateHeight(window.outerHeight);

        const options = {
          cloud_name: configurationParams.cloudName,
          api_key: configurationParams.apiKey,
          max_files: maxFiles,
          multiple: maxFiles > 1,
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
          search: { expression },
          integration: { platform: 'contentful', type: 'contentful', version: APP_VERSION, environment: APP_ENV },
        };

        const instance = window.cloudinary.createMediaLibrary(options, {
          insertHandler: (data) => sdk.close(data),
        });

        const showOptions: ShowOptions = {
          remove_upload_operation: configurationParams.showUploadButton === 'false',
        };
        if (typeof configurationParams.startFolder === 'string' && configurationParams.startFolder.length) {
          showOptions.folder = { path: configurationParams.startFolder };
        }
        instance.show(showOptions);
      })();
    },
    [sdk, invocationParams, expression],
  );

  return <div ref={init} id="container" css={styles.container} />;
};

// ─── Multi-field mode (sidebar workflow) ─────────────────────────────────────

interface MultiFieldProps {
  sdk: DialogAppSDK<AppInstallationParameters>;
  slots: PickerSlot[];
}

const MultiFieldDialog = ({ sdk, slots }: MultiFieldProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [assignments, setAssignments] = useState<Record<string, MediaLibraryResultAsset[]>>(() =>
    Object.fromEntries(slots.map((s) => [s.slotKey, []])),
  );
  const activeIdxRef = useRef(0);
  const assignmentsRef = useRef(assignments);

  const updateActive = (idx: number) => {
    setActiveIdx(idx);
    activeIdxRef.current = idx;
  };

  const handleDone = useCallback(() => {
    sdk.close({ mode: 'multi-field', assignments: assignmentsRef.current });
  }, [sdk]);

  const totalSelected = Object.values(assignments).reduce((n, a) => n + a.length, 0);

  const init = useCallback(
    (container: HTMLDivElement) => {
      if (!container) return;
      (async () => {
        await loadScript('https://media-library.cloudinary.com/global/all.js');
        container.innerHTML = '';
        injectGlobal({
          'html, body, #root': { padding: 0, margin: 0, border: 0, height: '100%', overflow: 'hidden' },
        });

        const configurationParams = sdk.parameters.installation;
        const maxFiles = configurationParams.maxFiles ?? 10;
        const transformations = [];
        if (configurationParams.format !== 'none') transformations.push({ fetch_format: configurationParams.format });
        if (configurationParams.quality !== 'none') transformations.push({ quality: configurationParams.quality });

        container.style.paddingBottom = '56px';
        sdk.window.updateHeight(window.outerHeight);

        const options = {
          cloud_name: configurationParams.cloudName,
          api_key: configurationParams.apiKey,
          max_files: maxFiles,
          multiple: maxFiles > 1,
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
          integration: { platform: 'contentful', type: 'contentful', version: APP_VERSION, environment: APP_ENV },
        };

        const instance = window.cloudinary.createMediaLibrary(options, {
          insertHandler: (data: MediaLibraryResult) => {
            const idx = activeIdxRef.current;
            const slot = slots[idx];
            if (!slot) return;

            const current = assignmentsRef.current[slot.slotKey] ?? [];
            const remaining = slot.maxFiles - current.length;
            if (remaining <= 0) return;
            const next = [...current, ...data.assets.slice(0, remaining)];

            const updated = { ...assignmentsRef.current, [slot.slotKey]: next };
            assignmentsRef.current = updated;
            setAssignments({ ...updated });

            // Auto-advance to next slot that still has capacity
            const nextIdx = slots.findIndex(
              (s, i) => i > idx && (updated[s.slotKey]?.length ?? 0) < s.maxFiles,
            );
            if (nextIdx !== -1) updateActive(nextIdx);
          },
        });

        const showOptions: ShowOptions = {
          remove_upload_operation: configurationParams.showUploadButton === 'false',
        };
        if (typeof configurationParams.startFolder === 'string' && configurationParams.startFolder.length) {
          showOptions.folder = { path: configurationParams.startFolder };
        }
        instance.show(showOptions);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sdk],
  );

  return (
    <>
      <div ref={init} id="container" css={styles.container} />
      <div css={styles.toolbar}>
        <span css={styles.toolbarLabel}>Add to field:</span>
        <Menu>
          <Menu.Trigger>
            <Button variant="secondary" size="small" endIcon={<ArrowDownIcon />} style={{ minWidth: '260px', justifyContent: 'space-between' }}>
              {slots[activeIdx]
                ? `${slots[activeIdx].fieldName} — ${slots[activeIdx].localeName}`
                : 'Select slot'}
            </Button>
          </Menu.Trigger>
          <Menu.List>
            {slots.map((slot, idx) => {
              const count = assignments[slot.slotKey]?.length ?? 0;
              const isActive = idx === activeIdx;
              return (
                <Menu.Item key={slot.slotKey} onClick={() => updateActive(idx)}>
                  <span css={styles.menuItemInner}>
                    {count > 0
                      ? <span css={styles.dot} title={`${count} selected`} />
                      : <span css={styles.dotPlaceholder} />}
                    <span style={{ fontWeight: isActive ? 700 : 400 }}>
                      {slot.fieldName} — {slot.localeName}
                      {count > 0 ? ` (${count})` : ''}
                    </span>
                  </span>
                </Menu.Item>
              );
            })}
          </Menu.List>
        </Menu>
        <div css={styles.actions}>
          <Button variant="secondary" size="small" onClick={() => sdk.close(undefined)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            isDisabled={totalSelected === 0}
            onClick={handleDone}>
            {totalSelected > 0 ? `Add to entry (${totalSelected})` : 'Add to entry'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ─── Router ───────────────────────────────────────────────────────────────────

const AssetPickerDialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const invocationParams = sdk.parameters.invocation as Record<string, unknown>;

  if (invocationParams.mode === 'multi-field') {
    const slots = invocationParams.slots as PickerSlot[];
    return <MultiFieldDialog sdk={sdk} slots={slots} />;
  }

  return <SingleFieldDialog sdk={sdk} invocationParams={invocationParams} />;
};

export default AssetPickerDialog;
