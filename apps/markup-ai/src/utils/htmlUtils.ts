/**
 * HTML utility functions for content detection and transformation
 */

/**
 * Detect if content is HTML (but not a full document)
 */
export const isHtmlFragment = (content: string): boolean => {
  const trimmed = content.trim();
  // Already a full HTML document
  if (/^<!DOCTYPE\s+html/i.test(trimmed) || /^<html/i.test(trimmed)) {
    return false;
  }
  // Check for common HTML element patterns
  return /<\/?(p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|blockquote|a|strong|em|br|hr)\b/i.test(
    trimmed,
  );
};

/**
 * Check if content is already a full HTML document
 */
export const isFullHtmlDocument = (content: string): boolean => {
  const trimmed = content.trim();
  return /^<!DOCTYPE\s+html/i.test(trimmed) || /^<html/i.test(trimmed);
};

/**
 * Wrap HTML fragment in a proper HTML document structure
 */
export const wrapInHtmlDocument = (content: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>
${content}
</body>
</html>`;
};

/**
 * Create File/Blob for content with appropriate extension
 * Ensures HTML content is wrapped in a proper document structure
 */
export const createContentBlob = (content: string, isHtml = false): File => {
  let finalContent = content;
  let useHtml = isHtml;

  // Check if content is HTML
  if (isFullHtmlDocument(content)) {
    // Already a full HTML document, use as-is
    useHtml = true;
  } else if (isHtml || isHtmlFragment(content)) {
    // HTML fragment - wrap in proper document structure
    finalContent = wrapInHtmlDocument(content);
    useHtml = true;
  }

  const extension = useHtml ? ".html" : ".txt";
  const mimeType = useHtml ? "text/html" : "text/plain";
  return new File([finalContent], `content${extension}`, { type: mimeType });
};
