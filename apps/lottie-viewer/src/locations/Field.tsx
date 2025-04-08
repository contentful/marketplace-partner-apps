import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { JsonEditor } from '@contentful/field-editor-json';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Flex, Collapse } from '@contentful/f36-components';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

const Field = () => {
  const [lottieJson, setLottieJson] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const sdk = useSDK<FieldAppSDK>();

  // Register the theme before Monaco loads
  const handleEditorWillMount = (monacoInstance: typeof monaco) => {
    monacoInstance.editor.defineTheme('lightGrayEditor', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '1e1e1e', background: 'f5f5f5' },
        { token: 'string', foreground: '008000' },
        { token: 'number', foreground: '0000ff' },
        { token: 'keyword', foreground: 'af00db' },
      ],
      colors: {
        'editor.background': '#f5f5f5',
        'editor.foreground': '#1e1e1e',
        'editor.lineHighlightBackground': '#e0e0e0',
        'editorLineNumber.foreground': '#999999',
        'editorCursor.foreground': '#000000',
      },
    });
  };

  useEffect(() => {
    sdk.window.startAutoResizer();

    const value = sdk.field.getValue();
    console.log('[Initial Value]', value);
    if (value) {
      setLottieJson(value);
    }

    sdk.field.onValueChanged((newValue) => {
      console.log('[Field Changed]', newValue);
      setLottieJson(newValue ?? {});
    });
  }, [sdk]);

  return (
    <Flex style={{ height: '100%' }} flexDirection="row">
      <Flex flex="1" paddingRight="spacingM" style={{ height: '500px' }}>
        <Editor
          beforeMount={handleEditorWillMount}
          height="100%"
          defaultLanguage="json"
          value={JSON.stringify(lottieJson, null, 2)}
          theme="lightGrayEditor"
          onChange={(value) => {
            try {
              if (value) {
                const parsed = JSON.parse(value);
                setLottieJson(parsed);
                sdk.field.setValue(parsed);
              }
            } catch (e) {
              console.warn('[Invalid JSON]', e);
            }
          }}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'monospace',
            lineHeight: 22,
            wordWrap: 'on',
            renderLineHighlight: 'none',
            renderWhitespace: 'none',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              alwaysConsumeMouseWheel: false,
            },
            cursorBlinking: 'blink',
            mouseWheelZoom: false,
            tabSize: 2,
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            codeLens: false,
            lineDecorationsWidth: 0,
            guides: { indentation: false },
          }}
        />
      </Flex>

      <Flex flex="1" flexDirection="column" alignItems="center">
        {Object.keys(lottieJson || {}).length > 0 && (
          <>
            <DotLottieReact
              style={{ width: '100%', height: '500px' }}
              data={lottieJson}
              loop
              autoplay
            />
            <Collapse isExpanded={isExpanded}>
              <JsonEditor field={sdk.field} isInitiallyDisabled={false} />
            </Collapse>
          </>
        )}
      </Flex>
    </Flex>
  );
};

export default Field;
