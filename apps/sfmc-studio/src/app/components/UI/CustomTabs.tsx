import React from "react";
import { Tabs, Tooltip } from "antd";

const items: any[] = [
  {
    key: "1",
    label: "Unique Clicks",
    tooltip: "Unique Clicks",
  },
  {
    key: "2",
    label: "Click Rate",
    tooltip: "Percentage of recipients who clicked an email link.",
  },
  {
    key: "3",
    label: "Click to Open Rate",
    tooltip: "Percentage of email opens that resulted in link clicks.",
  },
];

const App = ({ setTab }: { setTab: (key: number) => void }) => (
  <Tabs
    className="TabsCustom"
    defaultActiveKey="1"
    items={items.map((el) => {
      return {
        label: <Tooltip title={el.tooltip}>{el.label}</Tooltip>,
        key: el.key,
      };
    })}
    onChange={(key) => setTab(+key)}
  />
);

export default App;
