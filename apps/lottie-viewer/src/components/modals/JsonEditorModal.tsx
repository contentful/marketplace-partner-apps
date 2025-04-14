import React, { useRef, useState } from 'react'
import * as monaco from 'monaco-editor';
import { Button, Modal, Heading, Paragraph, Box, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { styles } from '@src/locations/Field.styles';
import { css } from 'emotion';
import Editor from '@monaco-editor/react';

type Props = {
  showJsonModal: boolean;
  onShowJsonModalChange: (showJsonModal: boolean) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onEditorWillMount: (monaco: any) => void;
  updateUndoRedoState: () => void;
  onJsonEditorChange: (value?: string) => void;
  lottieJson: any;
}

export default function JsonEditorModal(props: Props) {
  const { showJsonModal, onShowJsonModalChange, onClear, onRedo, onUndo, canRedo, canUndo, onEditorWillMount, updateUndoRedoState, lottieJson, onJsonEditorChange } = props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  return (
    <>
      <Modal size="fullscreen" onClose={() => onShowJsonModalChange(false)} isShown={showJsonModal}>
        {() => (
          <>
            <Modal.Header
              title="Lottie Preview - JSON editor"
              onClose={() => onShowJsonModalChange(false)}
              className={css({ display: 'flex', position: 'relative' })}
            >
              <Box className={css({ position: 'absolute', right: '50px', display: 'flex', gap: `${tokens.spacingXs}` })}>
                <Button size="small" variant="secondary" onClick={onClear} style={{ color: tokens.red600 }}>
                  Clear
                </Button>
                <Button size="small" variant="secondary" onClick={onUndo} isDisabled={!canUndo}>
                  Undo
                </Button>
                <Button size="small" variant="secondary" onClick={onRedo} isDisabled={!canRedo}>
                  Redo
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
                    updateUndoRedoState(); // run once on load
                  }}
                  height="100%"
                  defaultLanguage="json"
                  theme="lightGrayEditor"
                  defaultValue={JSON.stringify(lottieJson, null, 2)}
                  options={styles.monaco.options}
                  onChange={onJsonEditorChange}
                />
              </Box>
            </Modal.Content>
          </>
        )}
      </Modal >
    </>
  );
}
