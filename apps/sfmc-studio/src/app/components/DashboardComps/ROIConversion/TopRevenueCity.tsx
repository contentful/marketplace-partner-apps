"use client";
import React from "react";
import style from "./topRevenueCity.module.scss";
import { formatInput } from "@/lib/utils/common";
import NoData from "@/components/UI/NoData";
import PieChartWithRadius from "@/components/charts/PieChart";
import { TopRevenueCityType } from "@/lib/types/dashboard";
import { useAppSelector } from "@/redux/hooks";

function TopRevenueCity({ revenueCity }: { revenueCity: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  let label = {
    text: (string: any, i: number, arr: any) => {
      let sum = arr.reduce((a: number, b: any) => a + b.revenue, 0);
      return `${((string["revenue"] * 100) / sum).toFixed(0)}%`;
    },
    style: {
      fontSize: 14,
      fontWeight: "bold",
      fill: "black",
    },
  };

  let tooltip = (d: any, index: number, data: any[]) => {
    let sum = data.reduce((a: number, b: any) => a + b.revenue, 0);
    let percentage = `${((d["revenue"] * 100) / sum).toFixed(0)}%`;

    return {
      name: data[index]["name"],
      value: percentage,
    };
  };

  return (
    <>
      <div className={style.RevenueCityMain}>
        <div className={style.RevenueCityColInner}>
          <h3>Top Revenue Generating Cities</h3>
          {!revenueCity?.length ? (
            ""
          ) : (
            <div className={style.CanvesDataGrapInner}>
              <div className={style.CanvesGrapInner}>
                {revenueCity?.length ? (
                  <PieChartWithRadius
                    data={revenueCity}
                    angleField="revenue"
                    colorField="name"
                    innerRadius={0}
                    width={200}
                    height={250}
                  />
                ) : (
                  ""
                )}
              </div>
              <div
                className={`${style.CanvesDataTable} ${style.CanvesDataTableWithOddEven}`}
              >
                <table className={style.CanvesMarkerTable}>
                  {revenueCity?.map((el: TopRevenueCityType, index: number) => (
                    <tr className={style?.[theme]} key={index}>
                      <td className={style.CanvesMarkerInner}>
                        <span
                          className={style.MarkerCanves}
                          style={{ backgroundColor: el.color }}
                        ></span>
                      </td>
                      <td>{el?.name}</td>
                      <td>{formatInput(el?.revenue, el?.CurrencyIsoCode)}</td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {!revenueCity?.length ? <NoData /> : ""}
    </>
  );
}
export default TopRevenueCity;
