import { FieldAppSDK } from "@contentful/app-sdk";
import { MarkdownEditor } from "@contentful/field-editor-markdown";
import { SingleLineEditor } from "@contentful/field-editor-single-line";
import { RichTextEditor } from "@contentful/field-editor-rich-text";

const getField = (sdk: FieldAppSDK) => {
  switch (sdk.field.type) {
    case "RichText":
      return <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />;

    case "Symbol":
      return (
        <SingleLineEditor
          field={sdk.field}
          locales={sdk.locales}
          isInitiallyDisabled={false}
          withCharValidation={true}
        />
      );

    case "Text":
      return <MarkdownEditor isInitiallyDisabled={false} minHeight="300px" sdk={sdk} />;

    default:
      // Should never reach here - only Text, Symbol, and RichText fields are supported
      return <div>Unsupported field type</div>;
  }
};

export default getField;
