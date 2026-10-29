/**
 * Pure functions which turn the stored field data (the Mediaflow file selector result) into what the asset card displays.
 */
import type { AssetType } from "@contentful/f36-components";
import type { MediaflowFileData, MetadataCheck } from "../types";

type ContentFieldId = "altText" | "description" | "keywords" | "photographer" | "instructions" | "additionalInfo";
type PreviewFieldId = "thumbPreview" | "mediumPreview" | "smallPreview";

/**
 * One row of the expandable metadata view
 */
export interface MetadataField {
  id: string;
  label: string;
  value: string;
  isEmpty: boolean;
  isTechnical: boolean;
}

/**
 * A titled group of rows in the expandable metadata view
 */
export interface MetadataSection {
  id: string;
  title: string;
  fields: MetadataField[];
}

/**
 * The status line of the asset card
 */
export interface MetadataStatus {
  tone: "positive" | "warning" | "negative" | "neutral";
  label: string;
}

const CONTENT_FIELDS: Array<{ id: ContentFieldId; label: string }> = [
  { id: "altText", label: "Alt text" },
  { id: "description", label: "Description" },
  { id: "keywords", label: "Keywords" },
  { id: "photographer", label: "Photographer" },
  { id: "instructions", label: "Instructions" },
  { id: "additionalInfo", label: "Additional info" },
];

const PREVIEW_FIELDS: PreviewFieldId[] = ["thumbPreview", "mediumPreview", "smallPreview"];

const STATUS_LABELS: Partial<Record<MetadataCheck["type"], string>> = {
  positive: "Up to date",
  warning: "Outdated",
};

/**
 * Checks whether a metadata value counts as not filled in
 *
 * @param value - Any metadata value
 * @returns true for null, undefined, blank strings and empty arrays
 */
export function isEmptyValue(value: unknown): boolean {
  if(value === null || value === undefined) {
    return true;
  }
  if(typeof value === "string") {
    return value.trim() === "";
  }
  if(Array.isArray(value)) {
    return value.every(isEmptyValue);
  }
  return false;
}

/**
 * Turns a metadata value into display text. Arrays are joined with commas
 *
 * @param value - Any metadata value
 * @returns The display text, or an empty string for empty values
 */
export function formatValue(value: unknown): string {
  if(isEmptyValue(value)) {
    return "";
  }
  if(Array.isArray(value)) {
    return value.filter(item => !isEmptyValue(item)).map(formatValue).join(", ");
  }
  if(typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value).trim();
}

/**
 * Formats width and height as "W × H px"
 *
 * @param width - The width in pixels
 * @param height - The height in pixels
 * @returns The dimensions, or an empty string if either is missing
 */
export function formatDimensions(width: string | number | undefined, height: string | number | undefined): string {
  if(isEmptyValue(width) || isEmptyValue(height)) {
    return "";
  }
  return width + " × " + height + " px";
}

/**
 * The largest width and height of the video player in the asset card
 */
export const VIDEO_PLAYER_MAX_SIZE = 480;

/**
 * Calculates the width of the video player so the whole video fits in a VIDEO_PLAYER_MAX_SIZE square.
 * The Mediaflow embed codes keep the video's aspect ratio and scale with the width,
 * so a portrait video needs a narrower player to not become very tall.
 *
 * @param width - The width of the video in pixels
 * @param height - The height of the video in pixels
 * @returns The maximum width of the player in pixels
 */
export function getVideoPlayerMaxWidth(width: string | number | undefined, height: string | number | undefined): number {
  const videoWidth = Number(width);
  const videoHeight = Number(height);
  if(!(videoWidth > 0) || !(videoHeight > 0)) {
    return VIDEO_PLAYER_MAX_SIZE;
  }
  return Math.round(Math.min(VIDEO_PLAYER_MAX_SIZE, VIDEO_PLAYER_MAX_SIZE * videoWidth / videoHeight));
}

/**
 * @param data - The field data
 * @returns The file type in capitals without a leading dot, e.g. "PDF"
 */
export function formatFileType(data: MediaflowFileData | null | undefined): string {
  if(!data || isEmptyValue(data.filetype)) {
    return "";
  }
  return String(data.filetype).replace(/^\./, "").trim().toUpperCase();
}

/**
 * Builds the grey line under the file name, e.g. "PDF · 321 × 444 px · Poster.pdf"
 *
 * @param data - The field data
 * @returns The summary, leaving out the parts that are missing
 */
export function formatFileSummary(data: MediaflowFileData): string {
  return [formatFileType(data), formatDimensions(data.width, data.height), formatValue(data.filename)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * @param data - The field data
 * @returns true if the Mediaflow file is an image
 */
export function isImage(data: MediaflowFileData | null | undefined): boolean {
  return data?.basetype === "image";
}

/**
 * The alt text warning only concerns images
 *
 * @param data - The field data
 * @returns true if the file is an image without alt text
 */
export function isAltTextMissing(data: MediaflowFileData): boolean {
  return isImage(data) && isEmptyValue(data.altText);
}

/**
 * @param data - The field data
 * @returns The keywords which are not blank
 */
export function getKeywords(data: MediaflowFileData): string[] {
  if(!Array.isArray(data.keywords)) {
    return [];
  }
  return data.keywords.filter(keyword => !isEmptyValue(keyword)).map(formatValue);
}

/**
 * Images show their (cropped) CDN url, other files the preview Mediaflow generated for them
 *
 * @param data - The field data
 * @returns The thumbnail url, or null if there is nothing to show
 */
export function getPreviewUrl(data: MediaflowFileData): string | null {
  if(isImage(data) && data.url && !isEmptyValue(data.url)) {
    return data.url;
  }
  const previewField = PREVIEW_FIELDS.find(field => !isEmptyValue(data[field]));
  return previewField ? data[previewField] ?? null : null;
}

/**
 * Maps a Mediaflow file to one of the Forma 36 AssetIcon types, used when there is no preview
 *
 * @param data - The field data
 * @returns A Forma 36 AssetType
 */
export function getAssetIconType(data: MediaflowFileData): AssetType {
  const fileType = formatFileType(data).toLowerCase();
  if(fileType === "pdf") {
    return "pdf";
  }
  if(["doc", "docx", "odt", "rtf"].includes(fileType)) {
    return "richtext";
  }
  if(["xls", "xlsx", "csv", "ods"].includes(fileType)) {
    return "spreadsheet";
  }
  if(["ppt", "pptx", "key", "odp"].includes(fileType)) {
    return "presentation";
  }
  if(["zip", "rar", "7z", "gz", "tar"].includes(fileType)) {
    return "archive";
  }
  if(fileType === "txt") {
    return "plaintext";
  }
  if(data.basetype === "image" || data.basetype === "video" || data.basetype === "audio") {
    return data.basetype;
  }
  return "plaintext";
}

/**
 * Creates one display row
 *
 * @param id - A key which is unique within its section
 * @param label - The row label
 * @param rawValue - The metadata value
 * @param options - Technical rows are monospaced and copyable
 * @returns The row
 */
function createField(id: string, label: string, rawValue: unknown, options: { isTechnical?: boolean } = {}): MetadataField {
  const value = formatValue(rawValue);
  return { id, label, value, isEmpty: value === "", isTechnical: !!options.isTechnical };
}

interface FormatBytesOptions {
  base?: number;
  decimals?: number;
  locale?: string | string[];
}

/**
 * Formats a number of bytes into a human-readable string (e.g. "1.5 kB").
 *
 * @param bytes - The number of bytes to format.
 * @param options - Optional formatting settings: base is the divisor between units, 1024 (binary) or 1000 (decimal/SI); the labels are always SI (kB, MB, …), regardless of base. decimals is the maximum number of fraction digits, ignored for plain bytes, which are always shown as integers. locale is the BCP 47 locale tag(s) passed to Intl.NumberFormat, e.g. "en-EN", and defaults to the runtime's locale.
 *
 * @returns The formatted string, e.g. "5 MB" or "1,5 kB" (de-DE).
 */
function formatBytes(bytes: unknown, { base = 1024, decimals = 2, locale }: FormatBytesOptions = {}): string | null {
  if(!bytes || typeof bytes != 'number') {
    return null;
  }

  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];

  if (!Number.isFinite(bytes) || bytes <= 0) { // Negative bytes shouldn't appear, so this special case is handled by just outputting it as bytes
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'byte' }).format(bytes || 0);
  }

  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[i],
    unitDisplay: 'short',
    maximumFractionDigits: i === 0 ? 0 : decimals,
  }).format(bytes / base ** i);
}

/**
 * Builds the sections of the expandable metadata view in display order
 *
 * @param data - The field data
 * @returns The sections with all their fields, empty ones included
 */
export function buildMetadataSections(data: MediaflowFileData): MetadataSection[] {
  const customFields = Array.isArray(data.customFields) ? data.customFields : [];

  return [
    {
      id: "content",
      title: "Content",
      fields: CONTENT_FIELDS.map(field => createField(field.id, field.label, data[field.id])),
    },
    {
      id: "customFields",
      title: "Custom fields",
      fields: customFields.map((customField, index) => createField(String(customField.fieldId ?? index), formatValue(customField.title), customField.value)),
    },
    {
      id: "file",
      title: "File",
      fields: [
        createField("filename", "Filename", data.filename),
        createField("type", "Type", formatFileType(data)),
        createField("filesize", "Filesize", formatBytes(data.filesize)),
        createField("dimensions", "Dimensions", formatDimensions(data.width, data.height)),
      ],
    },
    {
      id: "technical",
      title: "Technical",
      fields: [
        createField("id", "ID", data.id, { isTechnical: true }),
        createField("url", "CDN URL", data.url, { isTechnical: true }),
      ],
    },
  ];
}

/**
 * Counts the fields across all sections
 *
 * @param sections - The result of buildMetadataSections
 * @returns How many fields are filled, out of all fields
 */
export function countFilledFields(sections: MetadataSection[]): { filled: number; total: number } {
  const fields = sections.flatMap(section => section.fields);
  return {
    filled: fields.filter(field => !field.isEmpty).length,
    total: fields.length,
  };
}

/**
 * @param fields - The fields of one section
 * @param showEmptyFields - Whether empty fields are shown
 * @returns The fields to render
 */
export function getVisibleFields(fields: MetadataField[], showEmptyFields: boolean): MetadataField[] {
  if(showEmptyFields) {
    return fields;
  }
  return fields.filter(field => !field.isEmpty);
}

/**
 * Turns the result of the metadata check into the status line
 *
 * @param metadataCheck - The result of checkMetadata in Field.tsx
 * @param isSyncing - Whether metadata is being synced from Mediaflow right now
 * @param isChecking - Whether the metadata check is still running
 * @returns The tone and label of the status line
 */
export function getMetadataStatus(metadataCheck: MetadataCheck | null | undefined, isSyncing: boolean, isChecking: boolean): MetadataStatus {
  if(isSyncing) {
    return { tone: "neutral", label: "Syncing…" };
  }
  if(isChecking || !metadataCheck?.type) {
    return { tone: "neutral", label: "Checking…" };
  }
  if(metadataCheck.label) {
    return { tone: metadataCheck.type, label: metadataCheck.label };
  }
  const label = STATUS_LABELS[metadataCheck.type];
  if(label) {
    return { tone: metadataCheck.type, label };
  }
  return { tone: "negative", label: metadataCheck.value || "Could not check metadata" };
}
