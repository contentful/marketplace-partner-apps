export function sanitizeToken(raw?: string): string {
  if (typeof raw !== "string") return "";
  let out = raw.trim();
  const hasWrappingQuotes =
    out.length >= 2 &&
    ((out.startsWith('"') && out.endsWith('"')) ||
      (out.startsWith("'") && out.endsWith("'")) ||
      (out.startsWith("`") && out.endsWith("`")));
  if (hasWrappingQuotes) {
    out = out.slice(1, -1).trim();
  }
  return out;
}
