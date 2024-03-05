import tokens from '@contentful/f36-tokens';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { css } from 'emotion';

const MarkdownRender = ({ value }: { value: string }) => (
  <Markdown
    remarkPlugins={[remarkGfm]}
    className={css({
      maxWidth: tokens.contentWidthText,
      p: {
        margin: '1.5em 0',
      },
      h1: {
        margin: '1.5em 0',
      },
      h2: {
        margin: '1em 0',
      },
      img: {
        margin: '2em 0',
        maxWidth: '50%',
      },
    })}
    components={{
      a: ({ href, children }) => (
        <a href={href} target="_blank">
          {children}
        </a>
      ),
      img: ({ src }) => <img src={`/${src}`} alt="" />,
    }}>
    {value}
  </Markdown>
);

export default MarkdownRender;
