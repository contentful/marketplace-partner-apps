import { useCallback, useEffect, useState } from "react";
import {
  getFieldStyleGuide,
  setFieldStyleGuide,
  type FieldStyleGuideScope,
} from "../utils/fieldStyleGuide";

export interface UseFieldStyleGuideResult {
  /** The current per-field localStorage value, or null if not set. */
  fieldStyleGuide: string | null;
  /** Persist (or clear, when given null/empty) the per-field value. */
  setFieldStyleGuide: (value: string | null) => void;
}

/**
 * Reads + writes the per-field style guide override stored in localStorage.
 *
 * The scope must include `spaceId`, `environmentId`, `contentTypeId`, and
 * `fieldId` — otherwise the localStorage entry would leak across spaces or
 * environments that share the same content-type / field IDs. Callers thread
 * `spaceId`/`environmentId` from `sdk.ids`.
 *
 * Re-reads on cross-iframe `storage` events so two iframes editing the
 * same field stay in sync. No same-document dispatch — local React state
 * updates already keep the calling component current, and dispatching a
 * generic `storage` event would also wake every unrelated listener.
 */
export function useFieldStyleGuide(scope: Partial<FieldStyleGuideScope>): UseFieldStyleGuideResult {
  const { spaceId, environmentId, contentTypeId, fieldId } = scope;
  const [value, setValue] = useState<string | null>(() =>
    getFieldStyleGuide({ spaceId, environmentId, contentTypeId, fieldId }),
  );

  useEffect(() => {
    setValue(getFieldStyleGuide({ spaceId, environmentId, contentTypeId, fieldId }));
  }, [spaceId, environmentId, contentTypeId, fieldId]);

  useEffect(() => {
    if (!spaceId || !environmentId || !contentTypeId || !fieldId) return;
    const onStorage = () => {
      setValue(getFieldStyleGuide({ spaceId, environmentId, contentTypeId, fieldId }));
    };
    globalThis.addEventListener("storage", onStorage);
    return () => {
      globalThis.removeEventListener("storage", onStorage);
    };
  }, [spaceId, environmentId, contentTypeId, fieldId]);

  const update = useCallback(
    (next: string | null) => {
      if (!spaceId || !environmentId || !contentTypeId || !fieldId) return;
      setFieldStyleGuide({ spaceId, environmentId, contentTypeId, fieldId }, next);
      setValue(next && next.length > 0 ? next : null);
    },
    [spaceId, environmentId, contentTypeId, fieldId],
  );

  return { fieldStyleGuide: value, setFieldStyleGuide: update };
}
