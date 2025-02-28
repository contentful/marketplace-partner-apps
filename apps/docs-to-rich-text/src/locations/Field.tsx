import { useEffect, useRef } from 'react';
import { Tabs, GlobalStyles, Button, Popover, Box, TextInput, Skeleton, Card, Heading, Notification, Modal, Flex, Tooltip } from '@contentful/f36-components';
import { HelpCircleIcon, WarningIcon } from '@contentful/f36-icons';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { css } from '@emotion/css';
import { useState } from 'react';
import { IsWithinLicenseLimits } from '../api/licensing';
import { convert } from '../api/convert';
import { Document } from '@contentful/rich-text-types';
import { ConvertResponse, DocumentSource, ImportState } from '../types';
import { processImages, processImagesFromGoogleDrive } from '../utils/imageUpload';
import { isUrl } from '../utils/importUtils';
import { removeImagesFromDocument } from '../utils/imageRemoverUtils';
import { launchGoogleDrivePicker } from '../utils/googleDrivePicker';
import googleDriveLogo from '../assets/img/drive.png';

const styles = {
  popover: css({
    width: '110px',
    minHeight: '0 !important',
    height: '90% !important',
    marginBottom: '5px !important',
  }),
  tabs: css({
    justifyContent: 'end',
  }),
  layoutStyle: css({
    paddingRight: '5px',
    minHeight: '225px',
  }),
  iconButton: css({
    marginTop: '15px',
    width: '100%',
  }),
  iconButtonContainer: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '8px',
  }),
  iconImage: css({
    width: '30px',
    height: '30px',
  }),
  hrWithText: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    marginTop: '10px',
    marginBottom: '10px',
  }),
  hrLine: css({
    border: '0',
    borderTop: '1px solid #ccc',
    flexGrow: 1,
    height: '1px',
    margin: 0,
  }),
  orText: css({
    padding: '0 10px',
    fontWeight: 'bold',
    color: '#888',
    backgroundColor: 'white',
    lineHeight: '1',
    fontSize: '14px',
    marginTop: '-0.3em',
  }),
  importTitle: css({
    marginBottom: '20px !important',
  }),
  importHelpText: css({
    fontSize: '0.75rem !important',
    marginTop: '0.25rem !important',
    marginLeft: '0.5em !important',
  }),
  importTextInput: css({
    width: '200px !important',
  }),
  modalDriveButton: css({
    width: '200px',
  }),
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLicenseLimitBreached, setLicenseLimitBreached] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isModalShown, setModalShown] = useState(false);
  const [importState, setImportState] = useState<ImportState | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  sdk.window.startAutoResizer();

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
      let isGoogleDoc = false;
      setImportState({});
      setIsImporting(true);

      if (clipboardData.types.some((f: string) => f.includes('google-docs'))) {
        pastedText = clipboardData.getData('text/html');
        isGoogleDoc = true;
      } else {
        pastedText = clipboardData.getData('text/plain');
      }

      if (isUrl(pastedText)) {
        Notification.error('Document import by url is not supported. Please paste the contents of a Google or HTML document to import.');
        clearImportingState();
      } else {
        setImportState((prevState) => ({
          ...prevState,
          isGoogleDoc,
          source: DocumentSource.Paste,
          html: pastedText,
        }));
      }
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
    Notification.setPlacement('top');
    IsWithinLicenseLimits(sdk.cma, sdk.ids.app!, sdk.ids.space).then((isWithinLimits) => {
      setLicenseLimitBreached(!isWithinLimits);
    });
    if (hasCustomValidations()) {
      setShowValidationWarning(true);
    }
  }, [sdk]);

  function initGoogleDrivePicker() {
    clearImportingState();
    setIsOpen(false);
    setModalShown(false);
    setIsImporting(true);
    launchGoogleDrivePicker()
      .then((result) => {
        importFromGoogleDoc(result.html, result.markdown);
      })
      .catch(() => {
        Notification.error(
          'Oops! Something went wrong converting your document to rich text. Ensure your data is valid (e.g., correct HTML or Google Doc content) or try again later.',
        );
        clearImportingState();
      });
  }

  function importFromGoogleDoc(html: string, markdown: string) {
    setImportState((prevState) => ({
      ...prevState,
      isGoogleDoc: true,
      source: DocumentSource.GoogleDrive,
      html,
      markdown,
    }));
  }

  useEffect(() => {
    const handleHtml = async () => {
      if (!importState?.html) return;

      convert(importState!.html!, sdk)
        .then((result: ConvertResponse) => {
          setImportState((prevState) => ({
            ...prevState,
            richText: result.richText,
            images: result.images,
          }));
        })
        .catch(() => {
          Notification.error(
            'Oops! Something went wrong converting your document to rich text. Ensure your data is valid (e.g., correct HTML or Google Doc content) or try again later.',
          );
          clearImportingState();
        });
    };

    handleHtml();
  }, [importState?.html]);

  useEffect(() => {
    const handleImages = async () => {
      if (importState?.images) {
        const imageResult =
          importState.source === DocumentSource.Paste
            ? await processImages(sdk, importState.images)
            : await processImagesFromGoogleDrive(sdk, importState.images, importState.markdown!);
        setImportState({
          ...importState,
          imageUploadResult: imageResult,
        });
      }
    };

    handleImages();
  }, [importState?.images]);

  useEffect(() => {
    const handleImageProcessResult = async () => {
      if (importState?.imageUploadResult) {
        // Image failure from pasted google document
        if (!importState!.imageUploadResult.success && importState!.source === DocumentSource.Paste && importState!.isGoogleDoc) {
          // Display modal sugesting they select the file from Google Drive
          setModalShown(true);
        }
        // Image failure that isn't able to be corrected
        else if (!importState!.imageUploadResult.success) {
          handleImageFailure();
        } // success
        else {
          applyFieldChanges(importState!.richText!);
        }
      }
    };

    handleImageProcessResult();
  }, [importState?.imageUploadResult]);

  function clearImportingState() {
    setIsImporting(false);
    setImportState(null);
  }

  function handleImageFailure() {
    const document = removeImagesFromDocument(sdk, importState!.richText!, importState!.imageUploadResult!.failedImages);
    Notification.warning('Some images were unable to be imported');
    applyFieldChanges(document);
  }

  function applyFieldChanges(document: Document) {
    sdk.field.setValue(document);
    sdk.entry.save();
    clearImportingState();
  }

  function onDeclineGoogleDrivePicker() {
    setModalShown(false);
    handleImageFailure();
  }

  function hasCustomValidations() {
    // Default RTF validations configuration in Contentful
    const defaultValidation = {
      enabledMarksCount: 7,
      enabledNodeTypesCount: 17,
    };

    // Check if any validation differs from default
    return sdk.field.validations.some((validation) => {
      if (!validation.enabledMarks && !validation.enabledNodeTypes && !validation.nodes) {
        return true;
      }

      // Check if marks differ from default
      if (validation.enabledMarks && validation.enabledMarks.length !== defaultValidation.enabledMarksCount) {
        return true;
      }

      // Check if enabledNodeTypes differ from default
      if (validation.enabledNodeTypes && validation.enabledNodeTypes.length !== defaultValidation.enabledNodeTypesCount) {
        return true;
      }

      // Check if node types differ from default
      if (validation.nodes && Object.keys(validation.nodes).length > 0) {
        return true;
      }

      return false;
    });
  }

  const richTextEditor = <RichTextEditor sdk={sdk as FieldAppSDK} isInitiallyDisabled />;

  const googleImportButton = (
    <Button
      className={styles.iconButton}
      size="small"
      onClick={() => {
        initGoogleDrivePicker();
      }}>
      <span className={styles.iconButtonContainer}>
        <img src={googleDriveLogo} className={styles.iconImage} alt="Google Drive" />
        Choose from Drive
      </span>
    </Button>
  );

  const importPopover = (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <Popover.Trigger>
        <Button className={styles.popover} isLoading={isImporting} isDisabled={isImporting} onClick={() => setIsOpen(!isOpen)}>
          Import
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Box padding="spacingM">
          <Flex flexDirection="column" gap="spacingS" justifyContent="start" alignItems="start">
            <div>
              <Flex flexDirection="row" gap="spacing2Xs" justifyContent="center" alignItems="start">
                <TextInput className={styles.importTextInput} ref={inputRef} autoFocus placeholder="Paste HTML or Google doc" />
                <Tooltip placement="top" id="tooltip-1" content="Ctrl+V / ⌘V or right click & paste">
                  <HelpCircleIcon size="tiny" />
                </Tooltip>
              </Flex>
            </div>
            <div className={styles.hrWithText}>
              <hr className={styles.hrLine} />
              <span className={styles.orText}>or</span>
              <hr className={styles.hrLine} />
            </div>
            {googleImportButton}
          </Flex>
        </Box>
      </Popover.Content>
    </Popover>
  );

  const skeleton = (
    <Skeleton.Container>
      <Skeleton.BodyText offsetTop={37} numberOfLines={5} />
    </Skeleton.Container>
  );

  const validationWarning = (
    <Flex flexDirection="row" gap="spacingS" justifyContent="center" alignItems="center" paddingRight="spacingS">
      <Tooltip
        placement="bottom"
        id="tooltip-warning"
        content="Configured field restrictions may cause validation errors. Review field restrictions in the content model to learn more">
        <WarningIcon variant="warning"></WarningIcon>
      </Tooltip>
    </Flex>
  );

  const tabs = (
    <Tabs defaultTab="editor">
      <Tabs.List variant="vertical-divider" className={styles.tabs}>
        {showValidationWarning && validationWarning}
        {importPopover}
      </Tabs.List>
      <Tabs.Panel id="editor">{isImporting ? skeleton : richTextEditor}</Tabs.Panel>
    </Tabs>
  );

  const licenseLimitBreached = (
    <Card>
      <Heading>Docs to Rich Text Plan Limit Reached</Heading>
      <p>The free plan is limited to use in 5 content model fields. Upgrade to the premium plan for unlimited usage or reduce the field editor usages.</p>
      <br />
      <Button variant="primary" as="a" href="https://ellavationlabs.com/docs-to-rich-text/#pricing">
        Upgrade Now
      </Button>
    </Card>
  );

  const authPromptModal = (
    <Modal onClose={() => onDeclineGoogleDrivePicker()} isShown={isModalShown} size={'fullscreen'}>
      {() => (
        <>
          <Modal.Header title="Unable To Retrieve Images" onClose={() => onDeclineGoogleDrivePicker()} />
          <Modal.Content>Images were unable to be retrieved. Import by selecting the file from Google Drive, or continue without images.</Modal.Content>
          <Modal.Controls>
            <Button size="small" variant="transparent" onClick={() => onDeclineGoogleDrivePicker()}>
              Continue Without Images
            </Button>
            <div className={styles.modalDriveButton}>{googleImportButton}</div>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );

  return (
    <div className={styles.layoutStyle}>
      <GlobalStyles />
      {isLicenseLimitBreached ? licenseLimitBreached : tabs}
      {authPromptModal}
    </div>
  );
};

export default Field;
