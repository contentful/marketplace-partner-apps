import { useEffect, useState } from "react";
import { Flex, Select, TextInput, Paragraph } from "@contentful/f36-components";
import { DefaultValueType } from "../types/config";

interface Props {
  initial: {
    type: DefaultValueType;
    value?: any;
  };
  onChange: (val: { type: DefaultValueType; value?: any }) => void;
}

const FieldDateConfigurator = ({ initial, onChange }: Props) => {
  const [mode, setMode] = useState<DefaultValueType>(
    initial?.type ?? "current-date"
  );
  const [offset, setOffset] = useState<number>(
    typeof initial?.value === "number" ? initial.value : 0
  );

  useEffect(() => {
    if (mode === "offset-date") {
      onChange({ type: "offset-date", value: offset });
    } else {
      onChange({ type: mode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, offset]);

  const preview = (() => {
    const now = new Date();
    if (mode === "current-date") return now.toISOString().split("T")[0];
    if (mode === "start-of-month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start.toISOString().split("T")[0];
    }
    const off = new Date(now);
    off.setDate(now.getDate() + offset);
    return off.toISOString().split("T")[0];
  })();

  return (
    <Flex flexDirection="column" gap="spacingXs" style={{ width: "100%" }}>
      <Select
        id="date-mode-select"
        value={mode}
        onChange={(e) => setMode(e.target.value as DefaultValueType)}
      >
        <Select.Option value="current-date">Today (now)</Select.Option>
        <Select.Option value="offset-date">Today ± days</Select.Option>
        <Select.Option value="start-of-month">Start of month</Select.Option>
      </Select>

      {mode === "offset-date" && (
        <TextInput
          size="small"
          type="number"
          value={offset.toString()}
          onChange={(e) => setOffset(parseInt(e.target.value, 10) || 0)}
          placeholder="Number of days (e.g. 7)"
        />
      )}

      <Paragraph style={{ margin: 0, color: "#666" }}>
        Will resolve to: {preview}
      </Paragraph>
    </Flex>
  );
};

export default FieldDateConfigurator;
