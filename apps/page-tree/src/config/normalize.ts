export function normalizeBaseUrl(input: string): string {
  if (!input) return "";

  let v = input.trim().replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }

  return v;
}
