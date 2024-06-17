import { CFFieldType, GCFieldType } from "@/type/types";
import { ContentTypeFieldValidation } from "contentful-management";

export const CF_HIDDEN_FIELD = "GCMappingConfig";
export const CF_GC_ENTRY_NAME_FIELD = "GCEntryName";
export const IGNORE = "ignore";

export const cfTextFields = [CFFieldType.Symbol, CFFieldType.Text];
export const cfNumberFields = [CFFieldType.Number, CFFieldType.Integer];
export const cfComponentFields = [
  CFFieldType.Components,
  CFFieldType.SingleComponent,
];
export const plainTextOptions = [...cfTextFields, ...cfNumberFields];
export const richTextOptions = [...cfTextFields, CFFieldType.RichText];
export const repeatableTextOptions = [CFFieldType.RepeatablePlain, CFFieldType.RepeatableRich];

export const defaultRichTextValidations: ContentTypeFieldValidation[] = [
  {
    enabledMarks: [
      "bold",
      "italic",
      "underline",
      "code",
      "superscript",
      "subscript",
    ],
    message:
      "Only bold, italic, underline, code, superscript, and subscript marks are allowed",
  },
  {
    enabledNodeTypes: [
      "heading-1",
      "heading-2",
      "heading-3",
      "heading-4",
      "heading-5",
      "heading-6",
      "ordered-list",
      "unordered-list",
      "hr",
      "blockquote",
      "table",
      "hyperlink",
    ],
    message:
      "Only heading 1, heading 2, heading 3, heading 4, heading 5, heading 6, ordered list, unordered list, horizontal rule, quote, table and link to Url nodes are allowed",
  },
  {
    nodes: {},
  },
];

export const fieldMapOptions = [
  {
    name: "Text (Long)",
    contentful: CFFieldType.Text,
    gatherContent: [GCFieldType.Text],
  },
  {
    name: "Text (Short)",
    contentful: CFFieldType.Symbol,
    gatherContent: [GCFieldType.Text, GCFieldType.Radio],
  },
  {
    name: "Rich text",
    contentful: CFFieldType.RichText,
    gatherContent: [GCFieldType.Text],
  },
  {
    name: "Number (Integer)",
    contentful: CFFieldType.Integer,
    gatherContent: [GCFieldType.Text],
  },
  {
    name: "Number (Decimal)",
    contentful: CFFieldType.Number,
    gatherContent: [GCFieldType.Text],
  },
  {
    name: "Location",
    contentful: CFFieldType.Object,
    gatherContent: [],
  },
  {
    name: "Array",
    contentful: CFFieldType.Array,
    gatherContent: [GCFieldType.Checkbox],
  },
  {
    name: "Assets",
    contentful: CFFieldType.Assets,
    gatherContent: [GCFieldType.Attachment],
  },
  {
    name: "JSON Object",
    contentful: CFFieldType.Object,
    gatherContent: [GCFieldType.Component],
  },
  {
    name: "Single Component",
    contentful: CFFieldType.SingleComponent,
    gatherContent: [GCFieldType.Component],
  },
  {
    name: "Multiple Components",
    contentful: CFFieldType.Components,
    gatherContent: [GCFieldType.Component],
  },
  {
    name: "Repeatable Rich Text (custom app field)",
    contentful: CFFieldType.RepeatableRich,
    gatherContent: [GCFieldType.Text],
  },
  {
    name: "Repeatable Plain Text (custom app field)",
    contentful: CFFieldType.RepeatablePlain,
    gatherContent: [GCFieldType.Text],
  },
  // {
  //   name: "Date and time",
  //   contentful: "Date",
  //   gatherContent: [],
  // },

  // {
  //   name: "Boolean",
  //   contentful: "Boolean",
  //   gatherContent: [],
  // },
  // {
  //   name: "Media",
  //   contentful: "Link",
  //   gatherContent: [],
  // },
  // {
  //   name: "Reference",
  //   contentful: "Link",
  //   gatherContent: [],
  // },
];

export const contentfulTypeLabelMap = {
  [CFFieldType.Symbol]: "Text (Short)",
  [CFFieldType.Text]: "Text (Long)",
  [CFFieldType.Integer]: "Number (Integer)",
  [CFFieldType.Number]: "Number (Decimal)",
  [CFFieldType.Object]: "JSON Object",
  [CFFieldType.Array]: "Array",
  [CFFieldType.Ignore]: "Ignore",
  [CFFieldType.Assets]: "Assets reference",
  [CFFieldType.Components]: "Multiple components reference",
  [CFFieldType.SingleComponent]: "Single component reference",
  [CFFieldType.RichText]: "Rich text",
  [CFFieldType.RepeatableRich]: "Custom field for repeatable rich text",
  [CFFieldType.RepeatablePlain]: "Custom field for repeatable text",
};

export const GCFieldLabelMap = {
  [GCFieldType.Text]: "Text",
  [GCFieldType.Radio]: "Radio",
  [GCFieldType.Checkbox]: "Checkbox",
  [GCFieldType.Attachment]: "Attachment",
  [GCFieldType.Component]: "Component",
}