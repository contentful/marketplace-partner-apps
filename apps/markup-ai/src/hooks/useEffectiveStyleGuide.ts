import { useMemo } from "react";
import type { ContentTypeSettings } from "../types/appConfig";
import type { FieldStyleGuideScope } from "../utils/fieldStyleGuide";
import { useFieldStyleGuide } from "./useFieldStyleGuide";

export type StyleGuideSource = "field" | "contentType" | "none";

export interface UseEffectiveStyleGuideArgs extends Partial<FieldStyleGuideScope> {
  /** Default for the content type, set on the app config screen. */
  contentTypeDefault: ContentTypeSettings | undefined;
}

export interface UseEffectiveStyleGuideResult {
  /** The id Cortex should use as `style_guide_id`, or null if nothing has been picked. */
  effectiveStyleGuideId: string | null;
  /** Where the effective value came from — useful for the UI to label "field override" / "content type". */
  source: StyleGuideSource;
  /** The per-field localStorage value (null if not set). */
  fieldValue: string | null;
  /** The content-type default (null if not set). */
  contentTypeValue: string | null;
  /** Persist a new per-field override (or pass null/empty to clear). */
  setFieldStyleGuide: (value: string | null) => void;
}

/**
 * Resolves the active style guide for a given (space, env, contentType, field) tuple.
 *
 * Priority order:
 *   1. Per-field override (localStorage, scoped by space + env)
 *   2. Content-type default (app installation parameters)
 *   3. None — caller must surface an empty state; we deliberately do not
 *      auto-pick the API's `is_default` target.
 */
export function useEffectiveStyleGuide({
  spaceId,
  environmentId,
  contentTypeId,
  fieldId,
  contentTypeDefault,
}: UseEffectiveStyleGuideArgs): UseEffectiveStyleGuideResult {
  const { fieldStyleGuide, setFieldStyleGuide } = useFieldStyleGuide({
    spaceId,
    environmentId,
    contentTypeId,
    fieldId,
  });

  const contentTypeValue = contentTypeDefault?.styleGuide ?? null;

  const { effectiveStyleGuideId, source } = useMemo<{
    effectiveStyleGuideId: string | null;
    source: StyleGuideSource;
  }>(() => {
    if (fieldStyleGuide) return { effectiveStyleGuideId: fieldStyleGuide, source: "field" };
    if (contentTypeValue) {
      return { effectiveStyleGuideId: contentTypeValue, source: "contentType" };
    }
    return { effectiveStyleGuideId: null, source: "none" };
  }, [fieldStyleGuide, contentTypeValue]);

  return {
    effectiveStyleGuideId,
    source,
    fieldValue: fieldStyleGuide,
    contentTypeValue,
    setFieldStyleGuide,
  };
}
