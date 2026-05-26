/**
 * Per-field style guide override. Stored in localStorage under a stable key
 * scoped by `(spaceId, environmentId, contentTypeId, fieldId)` so the user's
 * pick persists across dialog opens and across iframe locations within the
 * same Contentful space — and so a saved override never leaks across spaces
 * or environments that happen to use the same content-type / field IDs.
 */

const STORAGE_PREFIX = "markupai.fieldStyleGuide.v2";

export interface FieldStyleGuideScope {
  spaceId: string;
  environmentId: string;
  contentTypeId: string;
  fieldId: string;
}

function isCompleteScope(scope: Partial<FieldStyleGuideScope>): scope is FieldStyleGuideScope {
  return Boolean(scope.spaceId && scope.environmentId && scope.contentTypeId && scope.fieldId);
}

export function getFieldStyleGuideKey(scope: FieldStyleGuideScope): string {
  return `${STORAGE_PREFIX}.${scope.spaceId}.${scope.environmentId}.${scope.contentTypeId}.${scope.fieldId}`;
}

export function getFieldStyleGuide(scope: Partial<FieldStyleGuideScope>): string | null {
  if (typeof localStorage === "undefined") return null;
  if (!isCompleteScope(scope)) return null;
  const value = localStorage.getItem(getFieldStyleGuideKey(scope));
  return value && value.length > 0 ? value : null;
}

export function setFieldStyleGuide(
  scope: Partial<FieldStyleGuideScope>,
  styleGuideId: string | null,
): void {
  if (typeof localStorage === "undefined") return;
  if (!isCompleteScope(scope)) return;
  const key = getFieldStyleGuideKey(scope);
  if (styleGuideId && styleGuideId.length > 0) {
    localStorage.setItem(key, styleGuideId);
  } else {
    localStorage.removeItem(key);
  }
  // No same-document `storage` event dispatch on purpose. React state in the
  // setter component already updates synchronously, and other iframes (the
  // dialog, sibling field iframes) pick up the change via the *native*
  // cross-document storage event. Dispatching one here would also fire every
  // unrelated `storage` listener (e.g. AuthContext session sync) for a write
  // they don't care about.
}
