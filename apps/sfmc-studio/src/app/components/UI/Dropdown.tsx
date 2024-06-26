import React from "react";

import { Button, Dropdown, Space } from "antd";
import parse from "html-react-parser";
import svgIcons from "@/lib/utils/icons";

const App = ({
  handleMenuClick,
  selectedItem,
  items,
}: {
  handleMenuClick: any;
  selectedItem: any;
  items: any;
}) => {
  return (
    <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
      <Button className="DropDownButton">
        <Space>
          {selectedItem || "Date Range"}
          <span className="DropDownIconCustom">{parse(svgIcons.DateDownIcon)}</span>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default App;
