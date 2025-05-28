import { useEffect, useRef, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Flex, Button, IconButton, Text } from '@contentful/f36-components';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ArrowsOutThinIcon, WarningOctagon } from '@src/assets';
import tokens from '@contentful/f36-tokens';
import LottieEditorHeader from '@src/components/content-entry/LottieEditorHeader';
import { styles } from './LottiePreviewField.styles';
import { css, cx } from 'emotion';
import JsonEditorModal from '@src/components/modals/JsonEditorModal';
import LottiePreviewModal from '@src/components/modals/LottiePreviewModal';
import { LottieJSON } from '@src/locations/Field';

type Props = {
  lottieJson: LottieJSON | Record<string, unknown>;
  onLottieJsonChange: (value: LottieJSON | Record<string, unknown>) => void;
}

const LottiePreviewField = (props: Props) => {
  const { lottieJson, onLottieJsonChange } = props;
  const [hasError, setHasError] = useState<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showLottiePreviewModal, setShowLottiePreviewModal] = useState(false);

  const sdk = useSDK<FieldAppSDK>();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const isUserTyping = useRef<boolean>(false);

  const handleShowJsonModalChange = (_showJsonModal: boolean) => {
    setShowJsonModal(_showJsonModal);
  }

  const handleShowLottiePreviewModalChange = (_showLottiePreviewModal: boolean) => {
    setShowLottiePreviewModal(_showLottiePreviewModal);
  }

  const handleEditorWillMount = (monacoInstance: typeof monaco) => {
    monacoInstance.editor.defineTheme('lightGrayEditor', {
      base: 'vs',
      inherit: true,
      rules: styles.monaco.rules,
      colors: styles.monaco.colors,
    });
  };

  useEffect(() => {
    sdk.window.startAutoResizer();

    const value = sdk.field.getValue();
    if (value) {
      onLottieJsonChange(value);
    }

    sdk.field.onValueChanged((newValue) => {
      if (!isUserTyping.current) {
        onLottieJsonChange(newValue || {});
      }
    });
  }, [sdk]);

  const updateUndoRedoState = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const editorModel = editor.getModel() as any
    if (!editorModel) return;

    // Use the undo/redo stack length to determine availability
    setCanUndo(editorModel.canUndo());
    setCanRedo(editorModel.canRedo());
  };

  const handleClear = () => {
    const cleared = '{}';
    const editor = editorRef.current;

    if (editor) {
      const fullRange = editor.getModel()!.getFullModelRange();

      editor.pushUndoStop();
      editor.executeEdits('clear', [
        {
          range: fullRange,
          text: cleared,
          forceMoveMarkers: true,
        },
      ]);
      editor.pushUndoStop();
      editor.getModel()?.pushStackElement();
    }

    onLottieJsonChange({});
    sdk.field.setValue({});
    setHasError(false);
    updateUndoRedoState();
  };

  const handleUndo = () => {
    editorRef.current?.trigger('source', 'undo', null);
    setTimeout(updateUndoRedoState, 50);
  };

  const handleRedo = () => {
    editorRef.current?.trigger('source', 'redo', null);
    setTimeout(updateUndoRedoState, 50);
  };

  const handleJsonEditorChange = (value?: string) => {
    if (value !== undefined) {
      isUserTyping.current = true;
      try {
        const parsed = JSON.parse(value);
        setHasError(false);
        onLottieJsonChange(parsed);
        sdk.field.setValue(parsed);
      } catch {
        setHasError(true);
      } finally {
        isUserTyping.current = false;
      }
    }
  }

  const handleModalSave = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      onLottieJsonChange(parsed);
      sdk.field.setValue(parsed);

      const editor = editorRef.current;
      const editorModel = editor?.getModel();
      if (editor && editorModel) {
        editor.pushUndoStop();
        const fullRange = editorModel.getFullModelRange();
        editor.executeEdits('modal-save', [
          {
            range: fullRange,
            text: JSON.stringify(parsed, null, 2),
            forceMoveMarkers: true,
          },
        ]);
        editor.pushUndoStop();
      }

      setShowJsonModal(false);
    } catch {
      setHasError(true);
    }
  };

  return (
    <Box>
      <Box
        testId='lottie-preview-field'
        className={styles.lottiePreviewFieldContainer(hasError)}
      >
        <Flex className={styles.lottieColumnParentContainer}>
          <Flex
            flexDirection="column"
            className={styles.lottieColumnContainer}
          >
            <LottieEditorHeader>
              <Box className={styles.editorHeaderText}>JSON editor</Box>
              <Flex gap="spacingXs">
                <Button
                  className={cx(
                    styles.lottieJsonEditorButtons,
                    css({ color: tokens.red600 })
                  )}
                  size="small" variant="secondary" onClick={handleClear}
                >
                  Clear
                </Button>
                <Button className={styles.lottieJsonEditorButtons} size="small" variant="secondary" onClick={handleUndo} isDisabled={!canUndo} >
                  Undo
                </Button>
                <Button className={styles.lottieJsonEditorButtons} size="small" variant="secondary" onClick={handleRedo} isDisabled={!canRedo}>
                  Redo
                </Button>
                <IconButton
                  className={styles.previewButton}
                  variant="secondary"
                  aria-label="preview-lottie-json"
                  icon={<ArrowsOutThinIcon width={20} height={20} />}
                  onClick={() => handleShowJsonModalChange(true)}
                />
              </Flex>
            </LottieEditorHeader>
            <Box className={css({ flex: 1, minHeight: 0 })}>
              <Editor
                beforeMount={handleEditorWillMount}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeModelContent(() => {
                    updateUndoRedoState();
                  });
                  updateUndoRedoState();

                  // Inject initial value on mount
                  const editorModel = editor.getModel();
                  if (editorModel) {
                    editorModel.setValue(JSON.stringify(lottieJson, null, 2));
                  }
                }}
                height="100%"
                defaultLanguage="json"
                theme="lightGrayEditor"
                options={styles.monaco.options}
                onChange={handleJsonEditorChange}
              />
            </Box>
          </Flex>

          <Flex
            flexDirection="column"
            className={styles.lottieColumnContainer}
          >
            <LottieEditorHeader additionalStyles={styles.rightPanelColumn}>
              <Box className={styles.editorHeaderText}>Preview</Box>
              <IconButton
                className={styles.previewButton}
                variant="secondary"
                aria-label="preview-animated-lottie-json"
                icon={<ArrowsOutThinIcon width={20} height={20} />}
                onClick={() => handleShowLottiePreviewModalChange(true)}
              />
            </LottieEditorHeader>
            <Box className={styles.lottieAnimatorContainer}>
              <DotLottieReact
                className={styles.dotLottieReact}
                key={JSON.stringify(lottieJson)}
                data={lottieJson}
                loop
                autoplay
              />
            </Box>
          </Flex>
        </Flex>
      </Box>

      <Box>
        {
          hasError && (
            <Box padding="spacingXs" className={styles.jsonErrorContainer}>
              <WarningOctagon width={20} height={20} />
              <Text fontSize="fontSizeM" fontColor="red400" >
                Invalid JSON
              </Text>
            </Box>
          )
        }

        <JsonEditorModal
          showJsonModal={showJsonModal}
          onShowJsonModalChange={handleShowJsonModalChange}
          onEditorWillMount={handleEditorWillMount}
          lottieJson={lottieJson}
          onSave={handleModalSave}
        />
        <LottiePreviewModal
          showLottiePreviewModal={showLottiePreviewModal}
          onShowLottiePreviewModalChange={handleShowLottiePreviewModalChange}
          lottieJson={lottieJson}
        />
      </Box>
    </Box>
  );
};

export default LottiePreviewField;