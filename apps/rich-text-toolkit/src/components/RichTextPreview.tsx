import { Highlight, themes } from 'prism-react-renderer';
import { Card } from '@contentful/f36-components';

type Props = {
  value: string;
};

export const RichTextPreview = ({ value = '{}' }: Props) => {
  return (
    <Card>
      <Highlight theme={themes.vsDark} code={value} language="js">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{
              ...style,
              marginTop: 0,
              height: '100%',
              width: '100%',
              borderRadius: '4px',
              padding: '4px',
            }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </Card>
  );
};
