"use client";
import React from "react";
import style from "./totalOrders.module.scss";
import NoData from "@/components/UI/NoData";
import LineChart from "@/components/charts/LineChart";
import { TopOrders } from "@/lib/types/dashboard";

function TotalOrders({ topOrders }: { topOrders: TopOrders[] }) {
  return (
    <>
      <div className={style.TopCitiesMain}>
        <div className={`CanvesData ${style.TopCitiesColInner}`}>
          <h3>Total Orders By Date</h3>
          {topOrders?.length ? (
            <LineChart
              data={topOrders}
              xField="Date"
              yField="count"
              dateShow={true}
              axisXTitle=""
              axisYTitle="Orders"
              toolTipText="Orders"
              showAnnotations={false}
              height={320}
              labelFormatter={false}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      {!topOrders?.length ? <NoData /> : ""}
    </>
  );
}

export default TotalOrders;
