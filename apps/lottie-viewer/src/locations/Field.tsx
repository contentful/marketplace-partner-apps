import { useEffect, useRef, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Flex, Collapse, Button, Icon, IconButton } from '@contentful/f36-components';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ArrowsOutThinIcon } from '@src/assets';
import tokens from '@contentful/f36-tokens';
import LottieEditorHeader from '@src/components/content-entry/LottieEditorHeader';
import { styles } from './Field.styles';
import { css } from 'emotion';

const Field = () => {
  const [lottieJson, setLottieJson] = useState<any>({});
  const [editorValue, setEditorValue] = useState<string>('{}');
  const sdk = useSDK<FieldAppSDK>();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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
      setEditorValue(JSON.stringify(value, null, 2));
    }

    sdk.field.onValueChanged((newValue) => {
      setLottieJson(newValue ?? {});
      setEditorValue(JSON.stringify(newValue ?? {}, null, 2));
    });
  }, [sdk]);

  const handleClear = () => {
    // Define the cleared JSON string and get the current editor instance
    const cleared = '{}';
    const editor = editorRef.current;

    // Get the entire range of the current editor content and clear it
    if (editor) {
      const fullRange = editor.getModel()!.getFullModelRange();

      editor.executeEdits('', [
        {
          range: fullRange,
          text: cleared,
          forceMoveMarkers: true,
        },
      ]);

      // Create an undo stop so the clear action can be undone in one step
      editor.pushUndoStop();
    }

    setEditorValue(cleared);
  };


  const handleUndo = () => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  };

  const handleRedo = () => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  };

  const handleSave = () => {
    const value = editorRef.current?.getValue();
    try {
      if (value) {
        const parsed = JSON.parse(value);
        setLottieJson(parsed);
        sdk.field.setValue(parsed);
      }
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  return (
    <Flex flexDirection="row" className={css({ height: '500px' })}>
      <Flex flexDirection="column">
        <LottieEditorHeader>
          <Box>
            JSON editor
          </Box>
          <Flex gap="spacingXs">
            <Button size="small" variant="secondary" onClick={handleClear} style={{ color: tokens.red600 }}>
              Clear
            </Button>
            <Button size="small" variant="secondary" onClick={handleUndo}>
              Undo
            </Button>
            <Button size="small" variant="secondary" onClick={handleRedo}>
              Redo
            </Button>
            <Button size="small" variant="positive" onClick={handleSave}>
              Save
            </Button>
            <IconButton
              variant="secondary"
              aria-label="preview-lottie-json"
              icon={<ArrowsOutThinIcon width={20} height={20} />}
            />
          </Flex>
        </LottieEditorHeader>
        <Box className={css({ height: '100%' })}>
          <Editor
            beforeMount={handleEditorWillMount}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            height="100%"
            defaultLanguage="json"
            value={editorValue}
            theme="lightGrayEditor"
            onChange={(value) => {
              if (value !== undefined) {
                setEditorValue(value);
              }
            }}
            options={styles.monaco.options}
          /></Box>
      </Flex>

      <Flex flex="1">
        <Flex flexDirection="column" alignItems="center" className={css({ height: '100%' })}>
          <LottieEditorHeader additionalStyles={{ borderLeft: `1px solid ${tokens.gray500}` }}>
            <Box>
              Preview
            </Box>
            <IconButton
              variant="secondary"
              aria-label="preview-animated-lottie-json"
              icon={<ArrowsOutThinIcon width={20} height={20} />}
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
  );
};

export default Field;
