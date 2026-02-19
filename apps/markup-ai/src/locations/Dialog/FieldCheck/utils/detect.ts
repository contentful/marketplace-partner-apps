/**
 * Detects the syntax type of the given text content.
 * Supports HTML, Markdown, XML/DITA, and plain text.
 */

export type SyntaxKind = "html" | "markdown" | "xml" | "plaintext";

/**
 * Detects if the text is DITA-like XML
 */
export function isDitaLikeXml(text: string): boolean {
  return /<(topic|task|concept|reference|map|bookmap)/i.test(text);
}

/**
 * Detects the syntax kind of the provided text
 */
export function detectSyntaxKind(text: string): SyntaxKind {
  if (!text || text.trim().length === 0) {
    return "plaintext";
  }

  // Check for HTML/XML tags
  const hasXmlTags = /<\/?[a-z][\s\S]*>/i.test(text);

  if (hasXmlTags) {
    // Check for DITA XML
    if (isDitaLikeXml(text)) {
      return "xml";
    }

    // Check for HTML-specific tags
    if (/<(!DOCTYPE html|html|head|body|div|p|span|h[1-6]|ul|ol|li|table|tr|td)/i.test(text)) {
      return "html";
    }

    // Generic XML
    return "xml";
  }

  // Check for Markdown syntax
  // Headers, bold, italic, links, lists
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /\*\*.*\*\*/m, // Bold
    /__.*__/m, // Bold alternative
    /\[.+\]\(.+\)/m, // Links
    /^[-*+]\s/m, // Unordered lists
    /^\d+\.\s/m, // Ordered lists
    /^>\s/m, // Blockquotes
    /`[^`]+`/m, // Inline code
    /```[\s\S]*?```/m, // Code blocks
  ];

  if (markdownPatterns.some((pattern) => pattern.test(text))) {
    return "markdown";
  }

  return "plaintext";
}
