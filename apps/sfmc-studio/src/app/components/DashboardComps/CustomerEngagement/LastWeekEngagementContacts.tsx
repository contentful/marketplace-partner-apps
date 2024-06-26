"use client";
import CustomTabs from "@/components/UI/CustomTabs";
import style from "./lastWeekEngagementContacts.module.scss";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/ApiClients";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Column } from "@ant-design/plots";
import { useAppSelector } from "src/app/redux/hooks";
import NoData from "@/components/UI/NoData";
import { commonChartConfig } from "@/lib/utils/dashboards";
import { defaultSystemTZ } from "@/lib/utils/common";

const CountType = {
  1: "uniqueClicks",
  2: "clickRate",
  3: "clickToOpenRate",
};

type NewContacts = {
  Date: string;
  count: number;
};

export default function LastWeekEngagementContacts() {
  const client = ApiClient();
  const { parameters } = useSDK<PageAppSDK>();
  const { dateRange } = useAppSelector((state) => state.dateSlice);
  const [tab, setTab] = useState<number>(1);
  const [newContacts, setNewContacts] = useState<NewContacts[]>([]);

  useEffect(() => {
    fetchNewContact();
  }, [tab, dateRange]);

  const fetchNewContact = async () => {
    try {
      if (parameters?.installation?.licenseKey) {
        const res = await client.post(
          "api/dashboard/customer-engagement/last-week-contacts",
          {
            licenseKey: parameters.installation.licenseKey,
            clickCountType: CountType[tab as keyof typeof CountType],
            ...dateRange,
            clientTZ: defaultSystemTZ,
          }
        );

        if (res.status !== 200)
          console.log("Error occured fetching campaign data");

        setNewContacts(res.data.data);
      }
    } catch (err) {
      console.log("Error occured fetching campaign clicks");
    }
  };

  const config = {
    data: newContacts,
    xField: ((d: NewContacts) =>
      commonChartConfig.dateFormatForGraph(d.Date)) as unknown as string,
    yField: "count",
    height: 300,
    style: {
      fill: "#CFD9E0",
      maxWidth: 20,
    },
    axis: {
      y: {
        line: true,
        lineLineWidth: 1.7,
        grid: false,
        tick: false,
        labelSpacing: 10,
        labelFontSize: 14,
        labelFontWeight: 400,
        labelFill: "#111B2B",
        labelOpacity: 1,
        labelFontFamily: "SFProDisplay",
      },
      x: {
        line: true,
        lineLineWidth: 1.7,
        grid: false,
        labelFontSize: 14,
        labelFontWeight: 400,
        labelFill: "#111B2B",
        labelOpacity: 1,
        labelFontFamily: "SFProDisplay",
        style: {
          labelTransform: commonChartConfig.dateFieldLabelTransform,
        },
        tick: false,
        labelSpacing: 10,
      },
    },
    tooltip: (d: NewContacts, index: number, data: NewContacts[]) => ({
      value: data[index].count,
      name: "Count",
    }),
  };

  return (
    <div className={style.LastWeekEngagementContacts}>
      <div className={`CanvesData ${style.LastWeekEngagementContactsInner}`}>
        <h3>Campaign Engagement</h3>
        <CustomTabs setTab={setTab} />
        {newContacts?.length ? <Column key={tab} {...config} /> : <NoData />}
      </div>
    </div>
  );
}
