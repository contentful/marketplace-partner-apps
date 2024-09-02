"use client";
import React, { useState } from "react";
import style from "./topProductFamily.module.scss";
import NoData from "@/components/UI/NoData";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { multiLineChart } from "@/lib/utils/getColor";
import { commonChartConfig } from "@/lib/utils/dashboards";
import { useAppSelector } from "@/redux/hooks";
import { themeTextColor } from "@/lib/Constants";

export default function TopProductFamily({
  topProductFamily,
}: {
  topProductFamily: any;
}) {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const [textHover, setTextHover] = useState<string>("");

  let legend = {
    position: "bottom",
    itemLabelFontSize: 13,
    itemLabelFontFamily: "SFProDisplay",
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
    <div
      className={`${style.TopProductFamilyMain} ${
        theme == "dark" ? style.DarkTheme : ""
      }`}
    >
      <div className={`CanvesData ${style.TopProductFamilyInner} ${theme}`}>
        <h4>Top Product Family</h4>
        {topProductFamily?.length ? (
          <MultiLineChart
            data={topProductFamily}
            yField="revenue"
            colorField="family"
            legend={legend}
          />
        ) : (
          <NoData />
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
  );
}
