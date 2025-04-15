import { useEffect, useRef, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Flex, Button, IconButton, Text } from '@contentful/f36-components';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ArrowsOutThinIcon } from '@src/assets';
import tokens from '@contentful/f36-tokens';
import LottieEditorHeader from '@src/components/content-entry/LottieEditorHeader';
import { styles } from './Field.styles';
import { css, cx } from 'emotion';
import JsonEditorModal from '@src/components/modals/JsonEditorModal';
import LottiePreviewModal from '@src/components/modals/LottiePreviewModal';

const Field = () => {
  const [lottieJson, setLottieJson] = useState<any>({});
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
      setLottieJson(value);
    }

    sdk.field.onValueChanged((newValue) => {
      if (!isUserTyping.current) {
        setLottieJson(newValue ?? {});
      }
    });
  }, [sdk]);

  const updateUndoRedoState = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel() as any;
    if (!model) return;

    // Use the undo/redo stack length to determine availability
    setCanUndo(model.canUndo());
    setCanRedo(model.canRedo());
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

    setLottieJson({});
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
        setLottieJson(parsed);
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
      setLottieJson(parsed);
      sdk.field.setValue(parsed);

      const editor = editorRef.current;
      const model = editor?.getModel();
      if (editor && model) {
        editor.pushUndoStop();
        const fullRange = model.getFullModelRange();
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
    <Box
      className={cx(
        css({ display: 'flex', flexDirection: 'column' }),
        hasError && css({ border: `1px solid ${tokens.red400}` })
      )}
    >
      <Flex flexDirection="row" className={css({ height: '500px' })}>
        <Flex flexDirection="column" className={css({ flex: 1, minHeight: 0 })}>
          <LottieEditorHeader>
            <Box>JSON editor</Box>
            <Flex gap="spacingXs">
              <Button size="small" variant="secondary" onClick={handleClear} style={{ color: tokens.red600 }}>
                Clear
              </Button>
              <Button size="small" variant="secondary" onClick={handleUndo} isDisabled={!canUndo}>
                Undo
              </Button>
              <Button size="small" variant="secondary" onClick={handleRedo} isDisabled={!canRedo}>
                Redo
              </Button>
              <IconButton
                variant="secondary"
                aria-label="preview-lottie-json"
                icon={<ArrowsOutThinIcon width={20} height={20} />}
                onClick={() => handleShowJsonModalChange(true)}
              />
            </Flex>
          </LottieEditorHeader>
          <Box className={css({ flex: 1, minHeight: 0 })}>
            <Editor
              // key={JSON.stringify(lottieJson)}
              // defaultValue={JSON.stringify(lottieJson, null, 2)}
              beforeMount={handleEditorWillMount}
              onMount={(editor) => {
                editorRef.current = editor;
                editor.onDidChangeModelContent(() => {
                  updateUndoRedoState();
                });
                updateUndoRedoState();

                // Inject initial value on mount
                const model = editor.getModel();
                if (model) {
                  model.setValue(JSON.stringify(lottieJson, null, 2));
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

        <Flex flex="1">
          <Flex flexDirection="column" alignItems="center" className={css({ height: '100%' })}>
            <LottieEditorHeader additionalStyles={{ borderLeft: `1px solid ${tokens.gray500}` }}>
              <Box>Preview</Box>
              <IconButton
                variant="secondary"
                aria-label="preview-animated-lottie-json"
                icon={<ArrowsOutThinIcon width={20} height={20} />}
                onClick={() => handleShowLottiePreviewModalChange(true)}
              />
            </LottieEditorHeader>
            <Box className={styles.lottieAnimatorContainer}>
              <DotLottieReact
                className={css({ height: '100%', width: '100%' })}
                key={JSON.stringify(lottieJson)}
                data={lottieJson}
                loop
                autoplay
              />
            </Box>
          </Flex>
        </Flex>
      </Flex>

      {hasError && (
        <Box padding="spacingXs" style={{ backgroundColor: tokens.red100 }}>
          <Text fontSize="fontSizeS" fontColor="red400">
            Invalid JSON syntax. Please correct the error.
          </Text>
        </Box>
      )}

      <JsonEditorModal
        showJsonModal={showJsonModal}
        onShowJsonModalChange={handleShowJsonModalChange}
        onEditorWillMount={handleEditorWillMount}
        updateUndoRedoState={updateUndoRedoState}
        lottieJson={lottieJson}
        onSave={handleModalSave}
      />
      <LottiePreviewModal
        showLottiePreviewModal={showLottiePreviewModal}
        onShowLottiePreviewModalChange={handleShowLottiePreviewModalChange}
        lottieJson={lottieJson}
      />
    </Box>
  );
};

export default Field;