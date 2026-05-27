/**
 * Minimal JWT claim reader. Ported from the sidebar-app's `lib/jwt`.
 *
 * The Auth0 access token carries the *active* organization in its `org_id` /
 * `org_name` claims — present only when the user authenticated against a
 * specific Auth0 organization (i.e. `organization` was passed on `/authorize`).
 * We decode it client-side rather than calling an endpoint so the current-org
 * id is available synchronously for the OrganizationSwitcher (used to mark the
 * active row in the `/auth/organizations` list and to short-circuit re-auth
 * when the user re-selects the org they're already in).
 */

export interface JwtOrgInfo {
  orgId: string | null;
  orgName: string | null;
}

/** Decode a JWT's payload (second segment) into a claims object, or null if malformed. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const jsonText =
      typeof TextDecoder === "undefined" ? binary : new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extract the Auth0 organization claims (`org_id` / `org_name`) from an access token. */
export function getOrgInfoFromToken(token: string): JwtOrgInfo {
  const claims = decodeJwtPayload(token);
  const orgId = typeof claims?.org_id === "string" ? claims.org_id : null;
  const orgName = typeof claims?.org_name === "string" ? claims.org_name : null;
  return { orgId, orgName };
}
