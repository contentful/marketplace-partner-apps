"use client";
import React from "react";
import style from "./TotalUsers.module.scss";
import NoData from "@/components/UI/NoData";
import LineChart from "@/components/charts/LineChart";
import { useAppSelector } from "src/app/redux/hooks";

type TotalUsers = {
  Date: string;
  count: number;
};

function TotalUsers({ totalUsers }: { totalUsers: TotalUsers[] }) {
  let theme: string = useAppSelector((state) => state.themeSlice.theme);
  return (
    <div
      className={`${style.DeviceCategoryMain} ${theme} ${
        theme == "dark" ? style.DarkTheme : ""
      }`}
    >
      <div className={`CanvesData ${style.DeviceCategoryColInner}`}>
        <h3>Total Subscribers</h3>
        {totalUsers?.length ? (
          <LineChart
            data={totalUsers}
            xField="Date"
            yField="count"
            dateShow={true}
            axisXTitle=""
            axisYTitle="Active Subscribers"
            toolTipText="Subscribers"
            showAnnotations={false}
            height={240}
            labelFormatter={false}
          />
        ) : (
          <NoData />
        )}
      </div>
    </div>
  );
}

export default TotalUsers;
