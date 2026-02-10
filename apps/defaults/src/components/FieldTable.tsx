import { IconButton, Table } from "@contentful/f36-components";
import FieldTableRow from "./FieldTableRow";
import { SettingsIcon } from "@contentful/f36-icons";
import { css } from "emotion";
import { isSupportedFieldType } from "../utils";

interface Props {
  ctId: string;
  fields: any[];
}

const FieldTable = ({ ctId, fields }: Props) => {
  const rowAlignHeader = css({
    "& th": {
      verticalAlign: "middle",
    },
  });

  const sortedFields = [...fields].sort((a: any, b: any) => {
    const sup = (f: any) => isSupportedFieldType(f);
    return sup(a) === sup(b) ? 0 : sup(a) ? -1 : 1;
  });

  return (
    <>
      <Table style={{ marginTop: "8px" }}>
        <Table.Head>
          <Table.Row className={rowAlignHeader}>
            <Table.Cell as="th" style={{ maxWidth: 180, paddingLeft: "20px" }}>
              Name
            </Table.Cell>
            <Table.Cell as="th" style={{ width: 180 }}>
              Type
            </Table.Cell>

            <Table.Cell as="th" colSpan={2} style={{ width: 560 }}>
              Value
            </Table.Cell>
            <Table.Cell as="th" style={{ width: 120, textAlign: "center" }}>
              Status
            </Table.Cell>
            <Table.Cell as="th" style={{ width: 100, textAlign: "center" }}>
              Default
            </Table.Cell>
            <Table.Cell
              as="th"
              style={{
                width: 40,
                paddingRight: "20px",
              }}
            >
              <IconButton
                variant="transparent"
                size="small"
                aria-label="Settings"
                icon={<SettingsIcon variant="secondary" />}
                onClick={(e: any) => e.stopPropagation()}
              />
            </Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {sortedFields.map((field: any) => (
            <FieldTableRow
              key={`${ctId}-${field.id}`}
              ctId={ctId}
              field={field}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
};

export default FieldTable;
