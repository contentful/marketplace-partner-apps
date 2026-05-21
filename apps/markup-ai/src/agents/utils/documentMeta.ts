/**
 * Build the API `document_name` / `document_ref` pair sent on Cortex scan
 * requests. `document_name` carries the human-readable entry title;
 * `document_ref` is the unique identifier the backend uses to track scans
 * across runs and is derived from the title + field id + a file extension
 * that hints the source format (e.g. `My-Article_body.md`).
 */

import type { SyntaxKind } from "../../locations/Dialog/FieldCheck/utils";

export type FieldExtension = "html" | "md" | "txt";

/**
 * Map a Contentful field type to the file extension that best represents
 * the content actually submitted to Cortex:
 *   - RichText → html (we serialize the document to HTML before scanning)
 *   - Text → md (long-text fields use the markdown editor by default)
 *   - everything else (Symbol, unknown) → txt
 */
export function extensionForFieldFormat(fieldFormat: string): FieldExtension {
  if (fieldFormat === "RichText") return "html";
  if (fieldFormat === "Text") return "md";
  return "txt";
}

/**
 * When the field type alone is ambiguous (e.g. a `Text` field that
 * contains HTML, or a `Symbol` that happens to be markdown), refine the
 * extension using the syntax detected on the submitted content. Falls
 * back to the field-type default when content doesn't disambiguate.
 */
export function extensionForFieldAndContent(
  fieldFormat: string,
  detected: SyntaxKind | undefined,
): FieldExtension {
  if (detected === "html" || detected === "xml") return "html";
  if (detected === "markdown") return "md";
  if (detected === "plaintext") {
    // plaintext detection on a Text field shouldn't downgrade .md → .txt
    // (an empty draft of a markdown field is still "a markdown field").
    return extensionForFieldFormat(fieldFormat);
  }
  return extensionForFieldFormat(fieldFormat);
}

/**
 * Slugify a single piece of the document_ref (title or field id) — spaces
 * and other non-alphanumeric characters collapse to hyphens, leading and
 * trailing hyphens are trimmed. Casing is preserved so the resulting ref
 * still reads as a recognizable title.
 */
export function slugifyForDocumentRef(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface BuildDocumentRefArgs {
  /** Human-readable entry title (value of the content type's displayField). */
  title: string | null | undefined;
  /** Contentful field id (e.g. "descriptionBody"). */
  fieldId: string;
  /** File extension to append. */
  extension: FieldExtension;
}

/**
 * Construct the unique document_ref the Cortex API tracks scans against.
 * Format: `<slug-title>_<slug-fieldId>.<ext>` (e.g. `My-Article_body.md`).
 *
 * Returns `undefined` when the title slug is empty — the API treats
 * `document_ref` as optional and an empty/garbage ref is worse than
 * omitting it. The field id alone is not a meaningful identifier (it's
 * not unique across entries), so we don't fall back to a field-only ref.
 */
export function buildDocumentRef({
  title,
  fieldId,
  extension,
}: BuildDocumentRefArgs): string | undefined {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  if (trimmedTitle.length === 0) return undefined;
  const titleSlug = slugifyForDocumentRef(trimmedTitle);
  if (titleSlug.length === 0) return undefined;
  const fieldSlug = slugifyForDocumentRef(fieldId);
  if (fieldSlug.length === 0) return undefined;
  return `${titleSlug}_${fieldSlug}.${extension}`;
}
