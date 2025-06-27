import {
  CalendarIcon,
  AssetIcon,
  EntryIcon,
  CodeIcon,
} from "@contentful/f36-icons";

export type SupportedFieldUiType = "Date" | "Asset" | "Entry" | "JSON";

interface Props {
  type: SupportedFieldUiType;
  size?: "tiny" | "small" | "medium" | "large";
  variant?:
    | "primary"
    | "secondary"
    | "positive"
    | "negative"
    | "warning"
    | "white";
}

const FieldTypeIcon = ({
  type,
  size = "small",
  variant = "secondary",
}: Props) => {
  switch (type) {
    case "Date":
      return <CalendarIcon size={size} variant={variant} />;
    case "Asset":
      return <AssetIcon size={size} variant={variant} />;
    case "Entry":
      return <EntryIcon size={size} variant={variant} />;
    case "JSON":
    default:
      return <CodeIcon size={size} variant={variant} />;
  }
};

export default FieldTypeIcon;
