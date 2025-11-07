import { describe, it, expect } from 'vitest';
import { isLikelyHtmlString, isLikelyMarkdownString } from './contentDetection';

describe('contentDetection', () => {
  describe('isLikelyHtmlString', () => {
    it('should detect HTML with DOCTYPE declaration', () => {
      const html = '<!DOCTYPE html><html><head><title>Test</title></head><body>Content</body></html>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with lowercase doctype', () => {
      const html = '<!doctype html><html><head><title>Test</title></head><body>Content</body></html>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with html tag', () => {
      const html = '<html><head><title>Test</title></head><body>Content</body></html>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with head tag', () => {
      const html = '<head><title>Test</title></head>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with body tag', () => {
      const html = '<body>This is some content</body>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with title tag', () => {
      const html = '<title>My Page Title</title>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with div tag', () => {
      const html = '<div>Some content</div>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with span tag', () => {
      const html = '<span>Inline content</span>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with paragraph tag', () => {
      const html = '<p>This is a paragraph</p>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with heading tags', () => {
      expect(isLikelyHtmlString('<h1>Heading 1</h1>')).toBe(true);
      expect(isLikelyHtmlString('<h2>Heading 2</h2>')).toBe(true);
      expect(isLikelyHtmlString('<h3>Heading 3</h3>')).toBe(true);
      expect(isLikelyHtmlString('<h4>Heading 4</h4>')).toBe(true);
      expect(isLikelyHtmlString('<h5>Heading 5</h5>')).toBe(true);
      expect(isLikelyHtmlString('<h6>Heading 6</h6>')).toBe(true);
    });

    it('should detect HTML with attributes', () => {
      const html = '<div class="container" id="main">Content</div>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should detect HTML with nested tags', () => {
      const html = '<div><p>Paragraph with <strong>bold</strong> text</p></div>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should handle whitespace before HTML', () => {
      const html = '   <html><head><title>Test</title></head></html>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should only check first 256 characters', () => {
      const html = '<html><head><title>Test</title></head><body>' + 'x'.repeat(300) + '</body></html>';
      expect(isLikelyHtmlString(html)).toBe(true);
    });

    it('should not detect plain text as HTML', () => {
      const text = 'This is just plain text without any HTML tags.';
      expect(isLikelyHtmlString(text)).toBe(false);
    });

    it('should not detect text with angle brackets but no HTML tags', () => {
      const text = 'This has < and > symbols but no HTML tags.';
      expect(isLikelyHtmlString(text)).toBe(false);
    });

    it('should not detect text with invalid HTML-like content', () => {
      const text = '<nothtml>This is not a real HTML tag</nothtml>';
      expect(isLikelyHtmlString(text)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isLikelyHtmlString('')).toBe(false);
    });

    it('should handle string with only whitespace', () => {
      expect(isLikelyHtmlString('   \n\t   ')).toBe(false);
    });
  });

  describe('isLikelyMarkdownString', () => {
    it('should detect Markdown with frontmatter', () => {
      const markdown = `---
title: My Document
author: John Doe
---

# My Document

This is the content.`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with frontmatter and no content after', () => {
      const markdown = `---
title: My Document
---
`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with headings', () => {
      expect(isLikelyMarkdownString('# Heading 1')).toBe(true);
      expect(isLikelyMarkdownString('## Heading 2')).toBe(true);
      expect(isLikelyMarkdownString('### Heading 3')).toBe(true);
      expect(isLikelyMarkdownString('#### Heading 4')).toBe(true);
      expect(isLikelyMarkdownString('##### Heading 5')).toBe(true);
      expect(isLikelyMarkdownString('###### Heading 6')).toBe(true);
    });

    it('should detect Markdown with unordered lists', () => {
      const markdown = `- First item
- Second item
- Third item`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with asterisk lists', () => {
      const markdown = `* First item
* Second item`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with plus lists', () => {
      const markdown = `+ First item
+ Second item`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with ordered lists', () => {
      const markdown = `1. First item
2. Second item
3. Third item`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with links', () => {
      const markdown = '[Google](https://google.com)';
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with images', () => {
      const markdown = '![Alt text](image.jpg)';
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should detect Markdown with code fences', () => {
      const markdown = `\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\``;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should not detect inline code as Markdown (only code fences are detected)', () => {
      const markdown = 'Use the `console.log()` function to print to console.';
      expect(isLikelyMarkdownString(markdown)).toBe(false);
    });

    it('should detect complex Markdown document', () => {
      const markdown = `# My Document

This is a paragraph with some **bold** and *italic* text.

## Features

- Feature 1
- Feature 2
- Feature 3

### Code Example

\`\`\`javascript
const example = 'Hello, world!';
\`\`\`

[Visit our website](https://example.com) for more information.`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should handle whitespace before Markdown', () => {
      const markdown = '   # Heading with whitespace';
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should only check first 512 characters', () => {
      const markdown = '# Heading\n\n' + 'x'.repeat(600) + '\n\n## Another heading';
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });

    it('should not detect plain text as Markdown', () => {
      const text = 'This is just plain text without any Markdown formatting.';
      expect(isLikelyMarkdownString(text)).toBe(false);
    });

    it('should not detect HTML as Markdown', () => {
      const html = '<h1>This is HTML, not Markdown</h1>';
      expect(isLikelyMarkdownString(html)).toBe(false);
    });

    it('should not detect text with hash symbols but no headings', () => {
      const text = 'This has # symbols but no proper headings.';
      expect(isLikelyMarkdownString(text)).toBe(false);
    });

    it('should not detect text with dashes but no lists', () => {
      const text = 'This has - symbols but no proper lists.';
      expect(isLikelyMarkdownString(text)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isLikelyMarkdownString('')).toBe(false);
    });

    it('should handle string with only whitespace', () => {
      expect(isLikelyMarkdownString('   \n\t   ')).toBe(false);
    });

    it('should detect Markdown with mixed content', () => {
      const markdown = `Some text before

# Heading

More text with [a link](https://example.com) and \`inline code\`.

- List item 1
- List item 2`;
      expect(isLikelyMarkdownString(markdown)).toBe(true);
    });
  });
});
