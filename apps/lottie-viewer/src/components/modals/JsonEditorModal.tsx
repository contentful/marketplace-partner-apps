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
  onUndo: () => void;
  onRedo: () => void;
  onSave: (value: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onEditorWillMount: (monaco: any) => void;
  updateUndoRedoState: () => void;
  lottieJson: any;
};

export default function JsonEditorModal(props: Props) {
  const {
    showJsonModal,
    onShowJsonModalChange,
    onUndo,
    onRedo,
    onSave,
    canUndo,
    canRedo,
    onEditorWillMount,
    updateUndoRedoState,
    lottieJson,
  } = props;

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorValue, setEditorValue] = useState<string>('');

  // Initialize local state only when modal is shown
  useEffect(() => {
    if (showJsonModal) {
      setEditorValue(JSON.stringify(lottieJson, null, 2));
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
              <Button size="small" variant="secondary" onClick={onUndo} isDisabled={!canUndo}>
                Undo
              </Button>
              <Button size="small" variant="secondary" onClick={onRedo} isDisabled={!canRedo}>
                Redo
              </Button>
              <Button
                size="small"
                variant="positive"
                onClick={() => {
                  onSave(editorValue); // ✅ Send final string to Field
                }}
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
                  editor.onDidChangeModelContent(() => {
                    updateUndoRedoState();
                  });
                  updateUndoRedoState();
                }}
                height="100%"
                defaultLanguage="json"
                theme="lightGrayEditor"
                value={editorValue} // ✅ use local state
                options={styles.monaco.options}
                onChange={(val) => {
                  setEditorValue(val || '');
                }}
              />
            </Box>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
}
