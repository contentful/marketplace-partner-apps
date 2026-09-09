import type { ContentState } from "./types";

type SysLike = {
  publishedVersion?: number;
  version?: number;
};

/**
 * Contentful sys-based state:
 * - draft: no publishedVersion
 * - published: version === publishedVersion + 1
 * - changed: version > publishedVersion + 1
 */
export function computeStateFromSys(
  sys: SysLike | undefined | null,
): ContentState {
  const publishedVersion = sys?.publishedVersion;
  const version = sys?.version;

  if (!publishedVersion) return "draft";
  if (typeof version === "number" && version > publishedVersion + 1)
    return "changed";
  return "published";
}
