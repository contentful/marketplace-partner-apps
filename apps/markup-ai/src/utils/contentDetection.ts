// Simple and fast heuristic to detect likely HTML content in a string
export function isLikelyHtmlString(content: string): boolean {
  const sample = content.trimStart().slice(0, 256).toLowerCase();
  if (sample.startsWith('<!doctype html') || sample.startsWith('<html')) return true;
  // Common HTML tags early in documents
  return /<(head|body|title|div|span|p|h1|h2|h3|h4|h5|h6)\b/.test(sample);
}

// Heuristic to detect likely Markdown content in a string
export function isLikelyMarkdownString(content: string): boolean {
  const sample = content.trimStart().slice(0, 512);
  // Frontmatter
  if (/^---\n[\s\S]*?\n---\n/.test(sample)) return true;
  // Headings
  if (/^#{1,6}\s+.+/m.test(sample)) return true;
  // Lists
  if (/^(?:\s*[-*+]\s+\S|\s*\d+\.\s+\S)/m.test(sample)) return true;
  // Links or images
  if (/\[[^\]]+\]\([^)]+\)/.test(sample) || /!\[[^\]]*\]\([^)]+\)/.test(sample)) return true;
  // Code fences
  if (/```[\s\S]*?```/.test(sample)) return true;
  return false;
}
