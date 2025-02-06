"use client";
import React, { useState } from "react";
import style from "./topSoldProducts.module.scss";
import NoData from "@/components/UI/NoData";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { multiLineChart } from "@/lib/utils/getColor";
import { commonChartConfig } from "@/lib/utils/dashboards";
import { useAppSelector } from "@/redux/hooks";
import { themeTextColor } from "@/lib/Constants";

function TopSoldProducts({ soldProduct }: { soldProduct: any }) {
  const [textHover, setTextHover] = useState<string>("");
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);

  let legend = {
    position: "bottom",
    itemLabelFontSize: 13,
    itemLabelFontFamily: "var(--primary-font),sans-serif",
    itemLabelFontWeight: 400,
    itemLabelFill: themeTextColor[theme as keyof typeof themeTextColor],
    itemLabelStroke: themeTextColor[theme as keyof typeof themeTextColor],
    itemLabelStrokeOpacity: 0.4,
    itemMarker: "circle",
    layout: "grid",
    cols: 2,
    itemMarkerFill: (d: any[], index: number, data: any[]) =>
      multiLineChart[index],
    itemLabelText: (d: any) =>
      commonChartConfig.transformLegendText(d?.label, 20),
    mouseenter: (e: any) => {
      setTextHover(commonChartConfig.handleMouseEnter(e, 20));
    },
    mouseleave: (e: any) => setTextHover(""),
  };

  return (
    <>
      <div className={style.TopSoldMain}>
        <div className={`CanvesData ${style.TopSoldInner} ${theme}`}>
          <h4>Top Sold Products</h4>
          {soldProduct?.length ? (
            <MultiLineChart
              data={soldProduct}
              yField="revenue"
              colorField="category"
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
      {!soldProduct?.length ? <NoData /> : ""}
    </>
  );
}

export default TopSoldProducts;
