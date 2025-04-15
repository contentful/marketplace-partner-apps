import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Button, Modal, Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { styles } from '@src/locations/Field.styles';
import { css } from 'emotion';
import Editor from '@monaco-editor/react';

type Props = {
  showJsonModal: boolean;
  onShowJsonModalChange: (show: boolean) => void;
  onSave: (value: string) => void;
  onEditorWillMount: (monaco: any) => void;
  updateUndoRedoState: () => void;
  lottieJson: any;
};

export default function JsonEditorModal(props: Props) {
  const {
    showJsonModal,
    onShowJsonModalChange,
    onSave,
    onEditorWillMount,
    updateUndoRedoState,
    lottieJson,
  } = props;

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorValue, setEditorValue] = useState<string>('');
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const updateUndoRedo = () => {
    const model = editorRef.current?.getModel() as any;
    if (model) {
      setCanUndo(model.canUndo());
      setCanRedo(model.canRedo());
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
        const model = editorRef.current?.getModel();
        if (model) {
          model.setValue(initial);
          model.pushStackElement(); // Mark as baseline
          model.clearUndoStack();   // Reset undo/redo
        }
        updateUndoRedo();
      }, 0);
    }
  }, [showJsonModal, lottieJson]);

  return (
    <Modal size="fullscreen" onClose={() => onShowJsonModalChange(false)} isShown={showJsonModal}>
      {() => (
        <>
          <Modal.Header
            title="Lottie Preview - JSON editor"
            onClose={() => onShowJsonModalChange(false)}
            className={css({ display: 'flex', position: 'relative' })}
          >
            <Box
              className={css({
                position: 'absolute',
                right: '50px',
                display: 'flex',
                gap: `${tokens.spacingXs}`,
              })}
            >
              <Button size="small" variant="secondary" onClick={handleUndo} isDisabled={!canUndo}>
                Undo
              </Button>
              <Button size="small" variant="secondary" onClick={handleRedo} isDisabled={!canRedo}>
                Redo
              </Button>
              <Button
                size="small"
                variant="positive"
                onClick={() => onSave(editorValue)}
              >
                Save
              </Button>
            </Box>
          </Modal.Header>
          <Modal.Content>
            <Box className={css({ width: '100%', height: '500px', flex: 1, minHeight: 0 })}>
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
                options={styles.monaco.options}
                onChange={(val) => setEditorValue(val || '')}
              />
            </Box>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
}
