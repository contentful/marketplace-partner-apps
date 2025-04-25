import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Button, Modal, Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';
import Editor from '@monaco-editor/react';
import { LottieJSON } from '@src/locations/Field';
import { styles } from '@src/components/modals/JsonEditorModal.styles';
import { styles as fieldStyles } from '@src/components/field/LottiePreviewField.styles';

type Props = {
  showJsonModal: boolean;
  onShowJsonModalChange: (show: boolean) => void;
  onSave: (value: string) => void;
  onEditorWillMount: (monaco: any) => void;
  lottieJson: LottieJSON | Record<string, unknown>;
};

export default function JsonEditorModal(props: Props) {
  const {
    showJsonModal,
    onShowJsonModalChange,
    onSave,
    onEditorWillMount,
    lottieJson,
  } = props;

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorValue, setEditorValue] = useState<string>('');
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const updateUndoRedo = () => {
    const editorModel = editorRef.current?.getModel() as any;
    if (editorModel) {
      setCanUndo(editorModel.canUndo());
      setCanRedo(editorModel.canRedo());
    }
  };

  const handleUndo = () => {
    editorRef.current?.trigger('source', 'undo', null);
    setTimeout(updateUndoRedo, 50);
  };

  const handleRedo = () => {
    editorRef.current?.trigger('source', 'redo', null);
    setTimeout(updateUndoRedo, 50);
  };

  // Reset content & undo/redo history when modal opens
  useEffect(() => {
    if (showJsonModal) {
      const initial = JSON.stringify(lottieJson, null, 2);
      setEditorValue(initial);

      // Reset undo/redo stack on actual Monaco model if already mounted
      setTimeout(() => {
        const editorModel = editorRef.current?.getModel();
        if (editorModel) {
          editorModel.setValue(initial);
          editorModel.pushStackElement(); // Mark as baseline
        }
        updateUndoRedo();
      }, 0);
    }
  }, [showJsonModal, lottieJson]);

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
  };

  const handleSaveClick = () => {
    onSave(editorValue)
    onShowJsonModalChange(false)
  }

  return (
    <Modal size="fullscreen" onClose={() => onShowJsonModalChange(false)} isShown={showJsonModal}>
      {() => (
        <>
          <Modal.Header
            title="Lottie Preview - JSON editor"
            onClose={() => onShowJsonModalChange(false)}
            className={css({ display: 'flex', position: 'relative' })}
          />

          <Modal.Content className={styles.modalContentContainer}>
            <Box className={styles.lottieAnimatorContainer}>
              <Box className={styles.greyBar} >
                <Box
                  className={css({
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: `${tokens.spacingXs}`,
                    marginRight: tokens.spacing2Xs
                  })}
                >
                  <Button
                    className={cx(
                      styles.lottieJsonEditorButtons,
                      css({ color: tokens.red600 })
                    )}
                    size="small" variant="secondary" onClick={handleClear}
                  >
                    Clear
                  </Button>
                  <Button className={styles.lottieJsonEditorButtons} size="small" variant="secondary" onClick={handleUndo} isDisabled={!canUndo}>
                    Undo
                  </Button>
                  <Button className={styles.lottieJsonEditorButtons} size="small" variant="secondary" onClick={handleRedo} isDisabled={!canRedo}>
                    Redo
                  </Button>
                </Box>
              </Box>
              <Editor
                beforeMount={onEditorWillMount}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeModelContent(updateUndoRedo);
                  updateUndoRedo();
                }}
                height="100%"
                defaultLanguage="json"
                theme="lightGrayEditor"
                value={editorValue}
                options={fieldStyles.monaco.options}
                onChange={(val) => setEditorValue(val || '')}
              />
            </Box>
            <Box className={styles.buttonContainer}>
              <Button
                className={css({ maxHeight: '36px', minHeight: '36px' })}
                variant='primary'
                onClick={handleSaveClick}
              >
                Save
              </Button>
            </Box>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
}
