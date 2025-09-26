export type SupportedUiType = "Date" | "Asset" | "Entry" | "JSON";

export interface FieldTypeInfo {
  uiType?: SupportedUiType;
  display: string;
}

export function mapFieldType(field: any): FieldTypeInfo {
  if (field.type === "Date") {
    return { uiType: "Date", display: "Date & time" };
  }

  if (field.type === "Link" && field.linkType === "Asset") {
    return { uiType: "Asset", display: "Media" };
  }

  if (field.type === "Link" && field.linkType === "Entry") {
    return { uiType: "Entry", display: "Reference" };
  }

  if (field.type === "Symbol") {
    return { uiType: undefined, display: "Short text" };
  }

  if (field.type === "Text") {
    return { uiType: undefined, display: "Long text" };
  }

  if (field.type === "RichText") {
    return { uiType: undefined, display: "Rich text" };
  }

  if (field.type === "Object") {
    return { uiType: "JSON", display: "JSON object" };
  }

  if (
    field.type === "Array" &&
    field.items?.type === "Link" &&
    field.items?.linkType === "Asset"
  ) {
    return { uiType: "Asset", display: "Media (multi)" };
  }

  if (
    field.type === "Array" &&
    field.items?.type === "Link" &&
    field.items?.linkType === "Entry"
  ) {
    return { uiType: "Entry", display: "Reference (multi)" };
  }

  const fallback = field.linkType ? `${field.linkType} link` : field.type;
  return { uiType: undefined, display: fallback };
}

export function getSupportedFields(contentTypes: any[]): any[] {
  return contentTypes.filter((ct: any) => {
    return ct.fields.some((f: any) => isSupportedFieldType(f));
  });
}

export function isSupportedFieldType(field: any): boolean {
  if (field.id === "taxonomy") return false;

  if (field.type === "Date") return true;

  if (field.type === "Link") {
    return field.linkType === "Asset" || field.linkType === "Entry";
  }

  if (field.type === "Object") return true;

  if (field.type === "Array" && field.items?.type === "Link") {
    return field.items.linkType === "Asset" || field.items.linkType === "Entry";
  }

  return false;
}

export function normalizeIds(val: any): string[] {
  if (!val) return [];
  let rawIds: string[] = Array.isArray(val) ? val : [val];
  const splitAndTrim = (s: string) =>
    s
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  rawIds = rawIds.flatMap((item) =>
    typeof item === "string" ? splitAndTrim(item) : []
  );
  return Array.from(new Set(rawIds));
}
