"use client";
import React, { useState } from "react";
import style from "./topRevenueOrderType.module.scss";
import NoData from "@/components/UI/NoData";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { multiLineChart } from "@/lib/utils/getColor";
import { commonChartConfig } from "@/lib/utils/dashboards";
import { useAppSelector } from "@/redux/hooks";
import { themeTextColor } from "@/lib/Constants";

export default function TopRevenueOrderType({
  topRevenueOrderType,
}: {
  topRevenueOrderType: any;
}) {
  const [textHover, setTextHover] = useState<string>("");
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);

  let legend = {
    position: "bottom",
    itemLabelFontSize: 13,
    itemLabelFontFamily: "var(--primary-font) ,sans-serif",
    itemLabelFontWeight: 400,
    itemLabelFill: themeTextColor[theme as keyof typeof themeTextColor],
    itemLabelStroke: themeTextColor[theme as keyof typeof themeTextColor],
    itemLabelStrokeOpacity: 0.4,
    itemMarker: "circle",
    itemMarkerFill: (d: any[], index: number, data: any[]) =>
      multiLineChart[index],
    itemLabelText: (d: any) =>
      commonChartConfig.transformLegendText(d?.label, 10),
    mouseenter: (e: any) => {
      setTextHover(commonChartConfig.handleMouseEnter(e, 10));
    },
    mouseleave: (e: any) => setTextHover(""),
  };

  return (
    <>
      <div className={style.TopRevenueOrderMain}>
        <div className={`CanvesData ${style.TopRevenueOrderInner} ${theme}`}>
          <h4>Top Revenue By Order Type</h4>
          {topRevenueOrderType?.length ? (
            <MultiLineChart
              data={topRevenueOrderType}
              yField="revenue"
              colorField="Type"
              legend={legend}
            />
          ) : (
            ""
          )}
          {textHover !== "" && (
            <div
              className={`${
                theme == "dark" ? "LegendHover-dark" : "LegendHover"
              } `}
            >
              {textHover}
            </div>
          )}
        </div>
      </div>
      {!topRevenueOrderType?.length ? <NoData /> : ""}
    </>
  );
}
