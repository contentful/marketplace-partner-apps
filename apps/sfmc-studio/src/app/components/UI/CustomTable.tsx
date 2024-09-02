import React from "react";
import { Table, Typography } from "antd";
import type { TableProps } from "antd";
import { formatInput } from "@/lib/utils/common";
import { useAppSelector } from "@/redux/hooks";
const { Text } = Typography;

interface DataType {
  key: React.Key;
  no: number;
  name: string;
  clicks: number;
  sents: number;
}

const onChange: TableProps<DataType>["onChange"] = (
  pagination,
  filters,
  sorter,
  extra
) => {};

const CustomTable = ({
  data,
  columns,
  showTotal,
}: {
  data: any;
  columns: any;
  showTotal?: boolean;
}) => {
  let dataWithKey = data?.map((el: any, index: number) => {
    return { ...el, key: el?.id ? el?.id : `${index}` };
  });

  let theme: string = useAppSelector((state) => state.themeSlice?.theme);

  return (
    <Table
      className={`EngageTable ${theme}-table`}
      rowClassName={theme == "dark" ? "table-row-dark" : "table-row-light"}
      columns={columns}
      pagination={false}
      dataSource={dataWithKey}
      onChange={onChange}
      summary={(pageData) => {
        let totalUnique = 0;

        pageData.forEach(({ unique }: any) => {
          totalUnique += unique;
        });

        return (
          <>
            {showTotal ? (
              <Table.Summary.Row className={theme}>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text>{formatInput(totalUnique)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ) : (
              ""
            )}
          </>
        );
      }}
    />
  );
};

export default CustomTable;
