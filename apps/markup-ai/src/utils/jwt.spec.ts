import { describe, it, expect } from "vitest";
import { decodeJwtPayload, getOrgInfoFromToken } from "./jwt";

/** Build an unsigned JWT-shaped string with the given payload (base64url). */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.`;
}

describe("decodeJwtPayload", () => {
  it("decodes the payload segment into a claims object", () => {
    const token = makeJwt({ sub: "user123", org_name: "acme" });
    expect(decodeJwtPayload(token)).toMatchObject({ sub: "user123", org_name: "acme" });
  });

  it("returns null for a token without a payload segment", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null when the payload is not valid base64 JSON", () => {
    expect(decodeJwtPayload("aaa.!!!notbase64json!!!.bbb")).toBeNull();
  });
});

describe("getOrgInfoFromToken", () => {
  it("extracts org_id and org_name claims", () => {
    const token = makeJwt({ org_id: "org_acme", org_name: "acme" });
    expect(getOrgInfoFromToken(token)).toEqual({ orgId: "org_acme", orgName: "acme" });
  });

  it("returns nulls when the org claims are absent", () => {
    const token = makeJwt({ sub: "user123" });
    expect(getOrgInfoFromToken(token)).toEqual({ orgId: null, orgName: null });
  });

  it("returns nulls for a malformed token", () => {
    expect(getOrgInfoFromToken("garbage")).toEqual({ orgId: null, orgName: null });
  });

  it("ignores non-string org claims", () => {
    const token = makeJwt({ org_id: 42, org_name: { nested: true } });
    expect(getOrgInfoFromToken(token)).toEqual({ orgId: null, orgName: null });
  });
});
