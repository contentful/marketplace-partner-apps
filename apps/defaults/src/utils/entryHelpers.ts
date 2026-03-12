export const pickString = (v: any): string | undefined => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const first = Object.values(v).find((x) => typeof x === "string");
    return first as string | undefined;
  }
  return undefined;
};

export const getEntryTitle = (
  entry: any,
  contentTypes: any[]
): string | undefined => {
  const titleKeys = [
    "internalName",
    "internal_name",
    "internal name",
    "title",
    "name",
    "headline",
    "nameInternal",
    "name_internal",
  ];

  const ctDef = contentTypes.find(
    (c) => c.sys.id === entry.sys?.contentType?.sys?.id
  );
  if (ctDef?.displayField) {
    const title = pickString(entry.fields?.[ctDef.displayField]);
    if (title) return title;
  }

  for (const key of titleKeys) {
    const val = pickString(entry.fields?.[key]);
    if (val) return val;
  }

  for (const raw of Object.values(entry.fields ?? {})) {
    const val = pickString(raw);
    if (val) return val;
  }

  return undefined;
};

export const getEntryDescription = (
  entry: any,
  titleKeys: string[]
): string | undefined => {
  const descKeys = ["description", "summary", "subtitle", "body", "text"];
  let description: string | undefined;

  const tryAssign = (val?: string) => {
    if (val && val.trim().length > 0) {
      description = val.length > 120 ? `${val.substring(0, 117)}…` : val;
      return true;
    }
    return false;
  };

  for (const key of descKeys) {
    const val = pickString(entry.fields?.[key]);
    if (tryAssign(val)) break;
  }

  if (!description) {
    for (const [key, raw] of Object.entries(entry.fields ?? {})) {
      if (titleKeys.includes(key)) continue;
      if (tryAssign(pickString(raw))) break;
    }
  }

  return description;
};
