import { useEffect, useRef } from 'react';
import {
  Tabs,
  GlobalStyles,
  Button,
  Popover,
  Box,
  TextInput,
  Skeleton,
  Card,
  Heading,
  Notification,
  Modal,
  Flex,
  Tooltip,
  Image,
} from '@contentful/f36-components';
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
import { isOffice365Html } from '../utils/officeDocUtil';
import urlImage from '../assets/img/paste_url.png';
import contentImage from '../assets/img/paste_content.png';
import greenCheckImage from '../assets/img/green_check.png';
import redXImage from '../assets/img/red_x.png';

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
    width: '240px !important',
  }),
  modalDriveButton: css({
    width: '200px',
  }),
  hintRow: css({
    marginTop: '25px',
  }),
  hintSecondRow: css({
    marginTop: '60px',
  }),
  hintIcon: css({
    marginRight: '30px',
  }),
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLicenseLimitBreached, setLicenseLimitBreached] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGoogleAuthModalShown, setIsGoogleAuthModalShown] = useState(false);
  const [importState, setImportState] = useState<ImportState | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [isPasteInputErrorShown, setIsPasteInputErrorShown] = useState(false);

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
      let source = DocumentSource.Paste;
      setLoadingState();

      setImportState({});
      setIsImporting(true);

      if (isGoogleDoc(clipboardData)) {
        source = DocumentSource.GoogleDocPaste;
      }

      // if is google doc or office doc
      if (hasTypeTextHtml(clipboardData) && (isGoogleDoc(clipboardData) || isOffice365Html(clipboardData.getData('text/html')))) {
        pastedText = clipboardData.getData('text/html');
      } else {
        pastedText = clipboardData.getData('text/plain');
      }

      if (isUrl(pastedText)) {
        setIsPasteInputErrorShown(true);
        clearImportingState();
        return;
      }

      initializeImportState(source, pastedText);
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

  function isGoogleDoc(clipboardData: any) {
    return clipboardData.types.some((f: string) => f.includes('google-docs'));
  }

  function hasTypeTextHtml(clipboardData: any) {
    return clipboardData.types.some((f: string) => f.includes('text/html'));
  }

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
    setLoadingState();

    launchGoogleDrivePicker()
      .then((result) => initializeImportState(DocumentSource.GoogleDrivePicker, result.html, result.markdown))
      .catch(() => {
        Notification.error(
          'Oops! Something went wrong converting your document to rich text. Ensure your data is valid (e.g., correct HTML or Google Doc content) or try again later.',
        );
        clearImportingState();
      });
  }

  useEffect(() => {
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
  }, [importState?.html]);

  useEffect(() => {
    const handleImages = async () => {
      if (!importState?.images) return;
      const imageResult =
        importState.source === DocumentSource.GoogleDrivePicker
          ? await processImagesFromGoogleDrive(sdk, importState.images, importState.markdown!)
          : await processImages(sdk, importState.images);

      setImportState({
        ...importState,
        imageUploadResult: imageResult,
      });
    };

    handleImages();
  }, [importState?.images]);

  useEffect(() => {
    if (!importState?.imageUploadResult) return;

    // Image failure from pasted google document
    if (!importState!.imageUploadResult.success && importState!.source === DocumentSource.GoogleDocPaste) {
      // Display modal sugesting they select the file from Google Drive
      setIsGoogleAuthModalShown(true);
    } // Image failure that isn't able to be corrected
    else if (!importState!.imageUploadResult.success) {
      handleImageFailure();
    } // success
    else {
      applyFieldChanges(importState!.richText!);
    }
  }, [importState?.imageUploadResult]);

  function initializeImportState(source: DocumentSource, html: string, markdown?: string) {
    setImportState((prevState) => ({
      ...prevState,
      source,
      html,
      markdown,
    }));
  }

  function setLoadingState() {
    clearImportingState();
    setIsOpen(false);
    setIsGoogleAuthModalShown(false);
    setIsImporting(true);
  }

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
    setIsGoogleAuthModalShown(false);
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
        Choose from Google Drive
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
        <Box padding="spacingXs">
          <Flex flexDirection="column" gap="spacingS" justifyContent="start" alignItems="start">
            <div style={{ alignSelf: 'end', marginBottom: '-10px' }}>
              <Tooltip placement="top" id="tooltip-1" content="Ctrl+V / ⌘V or right click & paste">
                <HelpCircleIcon size="tiny" />
              </Tooltip>
            </div>
            <TextInput className={styles.importTextInput} ref={inputRef} autoFocus placeholder="Paste HTML, Google, or Word Doc" />
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
    <Modal onClose={() => onDeclineGoogleDrivePicker()} isShown={isGoogleAuthModalShown} size={'fullscreen'}>
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

  const pasteInputErrorModal = (
    <Modal onClose={() => setIsPasteInputErrorShown(false)} isShown={isPasteInputErrorShown} size={'fullscreen'}>
      {() => (
        <>
          <Modal.Header title="It Looks Like You Pasted a Link" onClose={() => setIsPasteInputErrorShown(false)} />
          <Modal.Content>
            Oops! It looks like you pasted a link instead of the document content. Please copy and paste the actual content from your Google, Word, or HTML
            document.
            <Flex justifyContent="center" alignItems="center" className={styles.hintRow}>
              <Image alt="Green checkmark" height="50px" width="auto" src={greenCheckImage} className={styles.hintIcon} />
              <Image alt="Selected content from Google Doc" height="auto" width="400px" src={contentImage} />
            </Flex>
            <Flex justifyContent="center" alignItems="center" className={styles.hintSecondRow}>
              <Image alt="Red X" height="50px" width="auto" src={redXImage} className={styles.hintIcon} />
              <Image alt="Import by Url is not supported" height="auto" width="400px" src={urlImage} />
            </Flex>
          </Modal.Content>
          <Modal.Controls>
            <Button size="small" variant="transparent" onClick={() => setIsPasteInputErrorShown(false)}>
              Close
            </Button>
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
      {pasteInputErrorModal}
    </div>
  );
};

export default Field;
