"use client";
import React from "react";
import style from "./campaignClicks.module.scss";
import CustomTable from "@/components/UI/CustomTable";
import { TableColumnsType, Tooltip } from "antd";
import { CampaignOpenType } from "@/lib/types/dashboard";

export default function TopCampaignOpen({
  campaignOpens,
}: {
  campaignOpens: any;
}) {
  const columns: TableColumnsType<CampaignOpenType> = [
    {
      title: "No",
      key: "no",
      render: (value, record, index) => {
        return index + 1;
      },
    },
    {
      title: "Campaign",
      dataIndex: "name",
      key: "name",
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          {name}
        </Tooltip>
      ),
    },
    {
      title: "Opens",
      dataIndex: "displayOpens",
      key: "displayOpens",
      sorter: {
        compare: (a: CampaignOpenType, b: CampaignOpenType) =>
          a.opens - b.opens,
        multiple: 2,
      },
    },
  ];

  return (
    <div className={style.CampaignClicksMain}>
      <div className={style.CampaignClicksInner}>
        <h4>Top Campaign By Opens</h4>
        <CustomTable data={campaignOpens} columns={columns} />
      </div>
    </div>
  );
}
