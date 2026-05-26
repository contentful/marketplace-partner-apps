import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "../../../test/utils/testUtils";
import { FieldErrorBoundary } from "./FieldErrorBoundary";

const Boom = ({ message }: { message: string }): never => {
  throw new Error(message);
};

describe("FieldErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error is thrown", () => {
    const { getByText } = render(
      <FieldErrorBoundary>
        <span>healthy content</span>
      </FieldErrorBoundary>,
    );
    expect(getByText("healthy content")).toBeInTheDocument();
  });

  it("renders the error UI and the underlying message when a child throws", () => {
    const { getByText } = render(
      <FieldErrorBoundary>
        <Boom message="document is corrupt" />
      </FieldErrorBoundary>,
    );

    expect(getByText("Editor Error")).toBeInTheDocument();
    expect(
      getByText(
        "This field has corrupted data structure. Please clear the field content and try again.",
      ),
    ).toBeInTheDocument();
    expect(getByText("document is corrupt")).toBeInTheDocument();
  });
});
