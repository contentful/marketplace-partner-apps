import { describe, it, expect, vi } from "vitest";
import type { FieldAppSDK } from "@contentful/app-sdk";
import { render } from "../../../test/utils/testUtils";
import getField from "./utils";

vi.mock("@contentful/field-editor-markdown", () => ({
  MarkdownEditor: () => <div data-testid="markdown-editor" />,
}));
vi.mock("@contentful/field-editor-single-line", () => ({
  SingleLineEditor: () => <div data-testid="single-line-editor" />,
}));
vi.mock("@contentful/field-editor-rich-text", () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

const makeSdk = (type: string): FieldAppSDK =>
  ({
    field: { type },
    locales: {},
  }) as unknown as FieldAppSDK;

describe("getField", () => {
  it("returns the RichTextEditor for RichText fields", () => {
    const { getByTestId } = render(getField(makeSdk("RichText")));
    expect(getByTestId("rich-text-editor")).toBeInTheDocument();
  });

  it("returns the SingleLineEditor for Symbol fields", () => {
    const { getByTestId } = render(getField(makeSdk("Symbol")));
    expect(getByTestId("single-line-editor")).toBeInTheDocument();
  });

  it("returns the MarkdownEditor for Text fields", () => {
    const { getByTestId } = render(getField(makeSdk("Text")));
    expect(getByTestId("markdown-editor")).toBeInTheDocument();
  });

  it("renders the unsupported placeholder for any other field type", () => {
    const { getByText } = render(getField(makeSdk("Number")));
    expect(getByText("Unsupported field type")).toBeInTheDocument();
  });
});
