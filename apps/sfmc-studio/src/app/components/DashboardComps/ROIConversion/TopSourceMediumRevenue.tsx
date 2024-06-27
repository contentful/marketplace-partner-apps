"use client";
import React from "react";
import style from "./topSourceMediumRevenue.module.scss";
import NoData from "@/components/UI/NoData";
import BarChart from "@/components/charts/BarChart";

function TopSourceMediumRevenue({ sourceRevenue }: { sourceRevenue: any }) {
  return (
    <>
      <div className={style.TopSourceMain}>
        <div className={`CanvesData ${style.TopSourceInner}`}>
          <h4>Revenue By Source/Medium</h4>
          {sourceRevenue?.length ? (
            <BarChart
              data={sourceRevenue}
              xField="name"
              yField="revenue"
              toolTipText="Revenue"
              labelText="displayRevenue"
              maxWidth={30}
              height={300}
              axisYTitle=""
            />
          ) : (
            ""
          )}
        </div>
      </div>
      {!sourceRevenue?.length ? <NoData /> : ""}
    </>
  );
}

export default TopSourceMediumRevenue;
