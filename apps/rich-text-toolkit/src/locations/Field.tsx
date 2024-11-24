import React, { useEffect, useRef } from 'react';
import { Tabs, IconButton, GlobalStyles, Button, Popover, Box, Paragraph, TextInput, Skeleton, Card, Heading, Notification } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { RichTextPreview } from '../components/RichTextPreview';
import { css } from '@emotion/css';
import { useState } from 'react';
import { CopyIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { IsWithinLicenseLimits } from '../api/licensing';
import { convert } from '../api/convert';

const styles = {
  popover: css({
    width: '110px',
    minHeight: '0 !important',
    height: '90% !important',
  }),
  popoverImportOnly: css({
    marginBottom: '5px !important',
  }),
  tabs: css({
    justifyContent: 'end',
  }),
  structurePreviewCopyButton: css({
    position: 'absolute',
    right: 30,
    top: 30,
  }),
  layoutStyle: css({
    paddingRight: '5px',
  }),
  structurePreviewContainerStyle: css({
    position: 'relative',
    height: 'calc(100vh - 35px)',
    maxHeight: 700,
    overflowY: 'scroll',
    overflowX: 'scroll',
  }),
  tab: css({
    fontWeight: 'normal',
    cursor: 'pointer',
    color: tokens.gray700,
    padding: tokens.spacingXs,
    minWidth: '70px',
    minHeight: '2.5rem !important',
    borderTop: `1px solid ${tokens.gray400} !important`,
    borderLeft: `1px solid ${tokens.gray400} !important`,
    borderRight: `1px solid ${tokens.gray400} !important`,
    borderTopLeftRadius: `${tokens.borderRadiusSmall} !important`,
    borderTopRightRadius: `${tokens.borderRadiusSmall} !important`,
    borderBottom: 'none',
    marginLeft: tokens.spacingXs,
    textAlign: 'center',
    backgroundColor: tokens.gray100,
    borderBottomColor: tokens.gray100,
    outline: 'none',
    '&:focus': {
      boxShadow: tokens.boxShadowHeavy,
    },
    transition: `all ${tokens.transitionEasingDefault} ${tokens.transitionDurationShort}`,
  }),
  inactiveTab: css({
    background: tokens.gray200,
    borderBottomColor: tokens.gray400,
    '&:hover': {
      background: tokens.gray300,
    },
  }),
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLicenseLimitBreached, setLicenseLimitBreached] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentValue, setCurrentValue] = React.useState({});
  const field = sdk.field;
  sdk.window.startAutoResizer();

  useEffect(() => {
    field.onValueChanged((value: any) => {
      // Don't run the previewer in cypress tests as it causes re rendering of the RichTextEditor and some brittle tests
      if (!window.location.search.includes('cypress')) {
        setCurrentValue(value);
      }
    });
  }, [field]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus the TextInput when the Popover opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const listener = (e: any) => {
      e.preventDefault(); // Prevent default pasting behavior
      const clipboardData = e.clipboardData;
      let pastedText;
      if (clipboardData.types.some((f: string) => f.includes('google-docs'))) {
        pastedText = clipboardData.getData('text/html');
      } else {
        pastedText = clipboardData.getData('text/plain');
      }

      onPaste(pastedText, sdk);
      setIsOpen(false);
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.focus();
      inputElement.addEventListener('paste', listener);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('paste', listener);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    IsWithinLicenseLimits(sdk.cma, sdk.ids.app!, sdk.ids.space).then((isWithinLimits) => {
      setLicenseLimitBreached(!isWithinLimits);
    });
  }, [sdk]);

  function onPaste(html: string, sdk: FieldAppSDK) {
    setIsImporting(true);
    convert(html, sdk)
      .then((richText) => {
        sdk.field.setValue(richText);
        sdk.entry.save();
        setIsImporting(false);
      })
      .catch(() => {
        Notification.error(
          'Oops! Something went wrong with the import. Ensure your data is valid (e.g., correct HTML or Google Doc content) or try again later.',
        );
        setIsImporting(false);
      });
  }

  const richTextEditor = <RichTextEditor sdk={sdk as FieldAppSDK} isInitiallyDisabled />;
  // https://github.com/contentful/field-editors/blob/master/packages/rich-text/stories/RichTextEditor.stories.tsx#L257
  const jsonPreview = (
    <div data-test-id="rich-text-structure-preview" className={styles.structurePreviewContainerStyle}>
      <RichTextPreview value={JSON.stringify(currentValue, null, 2)} />
      <IconButton
        variant="secondary"
        aria-label="Copy"
        icon={<CopyIcon size="small" variant="positive" />}
        className={styles.structurePreviewCopyButton}
        onClick={async () => {
          // https://stackoverflow.com/a/65996386
          async function copyToClipboard(textToCopy: string | null = '') {
            // Navigator clipboard api needs a secure context (https)
            if ((navigator as any).clipboard && window.isSecureContext) {
              await (navigator as any).clipboard.writeText(textToCopy);
            } else {
              // Use the 'out of viewport hidden text area' trick
              const textArea = document.createElement('textarea');
              textArea.value = textToCopy ?? '';

              // Move textarea out of the viewport so it's not visible
              textArea.style.position = 'absolute';
              textArea.style.left = '-999999px';

              document.body.prepend(textArea);
              textArea.select();

              try {
                document.execCommand('copy');
              } catch (error) {
                console.error(error);
              } finally {
                textArea.remove();
              }
            }
          }

          await copyToClipboard(JSON.stringify(currentValue, null, 2));
        }}
      />
    </div>
  );

  const importPopover = (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <Popover.Trigger>
        <Button
          className={`${styles.popover} ${!sdk.parameters.installation.enableJsonPreview ? styles.popoverImportOnly : ''}`}
          isLoading={isImporting}
          isDisabled={isImporting}
          onClick={() => setIsOpen(!isOpen)}>
          Import
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Box padding="spacingM">
          <Paragraph>Import HTML or Google Doc Content</Paragraph>
          <Paragraph>Ctrl+V / ⌘V or right click & paste</Paragraph>
          <TextInput ref={inputRef} autoFocus placeholder="Paste Here" />
        </Box>
      </Popover.Content>
    </Popover>
  );

  const skeleton = (
    <Skeleton.Container>
      <Skeleton.BodyText offsetTop={37} numberOfLines={5} />
    </Skeleton.Container>
  );

  const richTextEditorTab = (
    <Tabs.Tab panelId="editor" className={styles.tab} isDisabled={isImporting}>
      Editor
    </Tabs.Tab>
  );
  const jsonPreviewTab = (
    <Tabs.Tab panelId="json" className={styles.tab} isDisabled={isImporting}>
      JSON
    </Tabs.Tab>
  );

  const tabs = (
    <Tabs defaultTab="editor">
      <Tabs.List variant="vertical-divider" className={styles.tabs}>
        {sdk.parameters.installation.enableImport && importPopover}
        {sdk.parameters.installation.enableJsonPreview && richTextEditorTab}
        {sdk.parameters.installation.enableJsonPreview && jsonPreviewTab}
      </Tabs.List>
      <Tabs.Panel id="editor">{isImporting ? skeleton : richTextEditor}</Tabs.Panel>
      <Tabs.Panel id="json">{isImporting ? skeleton : jsonPreview}</Tabs.Panel>
    </Tabs>
  );

  const licenseLimitBreached = (
    <Card>
      <Heading>Rich Text Toolkit Plan Limit Reached</Heading>
      <p>The free plan is limited to use in 5 content model fields. Upgrade to the premium plan for unlimited usage or reduce the field editor usages.</p>
      <br />
      <Button variant="primary" as="a" href="https://ellavationlabs.com">
        Upgrade Now
      </Button>
    </Card>
  );

  return (
    <div className={styles.layoutStyle}>
      <GlobalStyles />
      {isLicenseLimitBreached ? licenseLimitBreached : tabs}
    </div>
  );
};

export default Field;
