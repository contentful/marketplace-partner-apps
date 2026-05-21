import type { TargetResponse } from "../../api-client/types.gen";

/**
 * Pick the preferred default style target id from a list of targets:
 * the one named "Main" if present, otherwise any target marked default
 * by the API, otherwise the first enabled target. Returns `undefined`
 * only when no enabled candidate exists. The final "first enabled"
 * fallback guarantees that any org with at least one usable target gets
 * a target_id chosen for it — the backend does not always pick a default
 * when the field is omitted, so we must always send one.
 *
 * Mirrors the sidebar-app implementation (INT-520).
 */
export function defaultStyleTargetId(targets: TargetResponse[]): string | undefined {
  const enabled = targets.filter((t) => t.enabled);
  const main = enabled.find((t) => t.display_name.trim() === "Main");
  if (main) return main.id;
  const apiDefault = enabled.find((t) => t.is_default);
  if (apiDefault) return apiDefault.id;
  return enabled[0]?.id;
}
