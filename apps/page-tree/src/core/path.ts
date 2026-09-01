export function normalizePath(raw: string): string {
  const s = (raw ?? "").trim().replace(/\/+/g, "/");
  if (!s) return "";
  if (s === "/") return "/";
  const withLeading = s.startsWith("/") ? s : `/${s}`;
  return withLeading.replace(/\/+$/, ""); // no trailing slash
}

export function isUnderRoot(path: string, root: string): boolean {
  if (!root) return true;
  const p = normalizePath(path);
  const r = normalizePath(root);
  if (!p || !r) return false;
  if (r === "/") return true;
  return p === r || p.startsWith(`${r}/`);
}

export function joinBaseUrl(baseUrl: string, path: string): string {
  const b = (baseUrl ?? "").trim().replace(/\/+$/, "");
  const p = normalizePath(path);
  return `${b}${p === "/" ? "/" : p}`;
}

export function lastSegment(path: string): string {
  const p = normalizePath(path);
  if (!p || p === "/") return "/";
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "/";
}

/**
 * Normalizes a configured route prefix:
 * - "" or "/" => ""
 * - ensures leading "/"
 * - strips trailing "/"
 * Examples:
 *  "news/" => "/news"
 *  "/news/" => "/news"
 *  "" => ""
 *  "/" => ""
 */
export function normalizeRoutePrefix(prefix?: string): string {
  const v = (prefix ?? "").trim();
  if (!v || v === "/") return "";
  const withLeading = v.startsWith("/") ? v : `/${v}`;
  return normalizePath(withLeading).replace(/\/+$/, "");
}

/**
 * Builds a site path from a routePrefix and a slugOrPath field value.
 *
 * Rules:
 * - If slugOrPath starts with "/" => treat as absolute path (routePrefix ignored)
 * - Else => join routePrefix + slug
 * - Always returns a normalized absolute path (leading "/"), or "" if inputs empty
 *
 * Examples:
 *  buildPath("", "about") => "/about"
 *  buildPath("/news", "a") => "/news/a"
 *  buildPath("/news", "/events/x") => "/events/x"   (absolute override)
 */
export function buildPath(
  routePrefix: string | undefined,
  slugOrPath: string,
): string {
  const raw = (slugOrPath ?? "").trim();
  if (!raw) return "";

  // absolute override (editor stored full path)
  if (raw.startsWith("/")) return normalizePath(raw);

  const prefix = normalizeRoutePrefix(routePrefix);
  const joined = prefix ? `${prefix}/${raw}` : `/${raw}`;
  return normalizePath(joined);
}

/**
 * Builds a full preview URL using baseUrl + built path.
 * If baseUrl is empty, returns the normalized site path.
 */
export function buildPreviewUrl(
  baseUrl: string,
  routePrefix: string | undefined,
  slugOrPath: string,
): string {
  const path = buildPath(routePrefix, slugOrPath);
  if (!path) return (baseUrl ?? "").trim() || "";
  return joinBaseUrl(baseUrl, path);
}
