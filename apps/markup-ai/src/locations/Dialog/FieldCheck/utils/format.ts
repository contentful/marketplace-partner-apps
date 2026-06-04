import { html as beautifyHtml } from "js-beautify";

/**
 * Formats HTML or XML content with proper indentation. Used by the editor preview
 * when rendering non-RichText fields as a read-only code block.
 */
export function formatMarkup(input: string, kind: "html" | "xml"): string {
  try {
    const beautified = beautifyHtml(input, {
      indent_size: 2,
      preserve_newlines: true,
      max_preserve_newlines: 1,
      wrap_line_length: 0,
      end_with_newline: false,
      indent_inner_html: true,
      extra_liners: kind === "html" ? ["head", "body", "html"] : [],
    });
    return beautified.replaceAll(/\n{2,}/g, "\n");
  } catch (error) {
    console.error("Error formatting markup:", error);
    return input;
  }
}
