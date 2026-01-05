import { describe, it, expect } from "vitest";
import { getApiErrorMessage } from "./errorMessage";

describe("getApiErrorMessage", () => {
  it("returns Error.message for Error instances", () => {
    expect(getApiErrorMessage(new Error("Boom"))).toBe("Boom");
  });

  it("returns detail for ErrorResponse-shaped objects", () => {
    const err = { detail: "Bad request", status: 400, request_id: "req1" };
    expect(getApiErrorMessage(err)).toBe("Bad request");
  });

  it("returns detail for ValidationErrorResponse-shaped objects", () => {
    const err = { detail: "Validation failed", status: 422, request_id: "req2", errors: [] };
    expect(getApiErrorMessage(err)).toBe("Validation failed");
  });

  it("returns detail for objects with detail property", () => {
    const err = { detail: "Custom error", other: "ignored" };
    expect(getApiErrorMessage(err)).toBe("Custom error");
  });

  it("returns the string itself for string errors", () => {
    expect(getApiErrorMessage("Plain string error")).toBe("Plain string error");
  });

  it("falls back to default for unknown shapes", () => {
    expect(getApiErrorMessage({})).toBe("An error occurred");
    expect(getApiErrorMessage(null)).toBe("An error occurred");
    expect(getApiErrorMessage(undefined)).toBe("An error occurred");
  });

  it("handles empty detail strings gracefully", () => {
    const err = { detail: "", status: 400 };
    expect(getApiErrorMessage(err)).toBe("An error occurred");
  });

  it("handles non-string detail values", () => {
    const err = { detail: 123, status: 400 } as unknown as { detail: string };
    expect(getApiErrorMessage(err)).toBe("An error occurred");
  });
});
