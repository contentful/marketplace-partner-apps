import { Flex, Textarea, Paragraph } from "@contentful/f36-components";
import { useState } from "react";

interface Props {
  initial: any;
  onValidJson: (val: any) => void;
}

const FieldJsonEditor = ({ initial, onValidJson }: Props) => {
  const hasInitial =
    initial !== undefined &&
    (typeof initial !== "object" || Object.keys(initial).length > 0);

  const [text, setText] = useState<string>(
    hasInitial ? JSON.stringify(initial, null, 2) : ""
  );
  const [error, setError] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    try {
      JSON.parse(val);
      setError(false);
    } catch {
      setError(true);
    }
  };

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(text);
      onValidJson(parsed);
    } catch {
      /* ignore invalid */
    }
  };

  return (
    <Flex flexDirection="column" gap="spacingXs" style={{ width: "100%" }}>
      <Textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        rows={6}
        placeholder="{}"
        style={{ fontFamily: "monospace" }}
      />
      {error && (
        <Paragraph style={{ margin: 0, color: "red" }}>Invalid JSON</Paragraph>
      )}
    </Flex>
  );
};

export default FieldJsonEditor;
