"use client";
import React from "react";
import style from "./orderByStatus.module.scss";
import { formatInput } from "@/lib/utils/common";
import NoData from "@/components/UI/NoData";
import PieChartWithRadius from "@/components/charts/PieChart";
import { OrderByStatusRetention } from "@/lib/types/dashboard";
import { useAppSelector } from "src/app/redux/hooks";

function OrderByStatus({ orderStatus }: { orderStatus: any }) {
  let theme: string = useAppSelector((state) => state.themeSlice.theme);
  let tooltip = (d: any, index: number, data: any[]) => ({
    color: data[index].color,
    value: `${formatInput(
      data[index]["count"],
      data?.[index]?.CurrencyIsoCode
    )}`,
    name: data[index]["status"],
  });

  return (
    <div
      className={`${style.OrderStatusMain} ${
        theme == "dark" ? style.DarkTheme : ""
      }`}
    >
      <div className={`${style.OrderStatusInner} ${theme}`}>
        <h4>Order By Status</h4>
        <div className={style.CanvesDataGrapInner}>
          <div className={style.CanvesGrapInner}>
            {orderStatus?.length ? (
              <PieChartWithRadius
                data={orderStatus}
                angleField="count"
                colorField="status"
                innerRadius={0.6}
                width={280}
                height={300}
              />
            ) : (
              ""
            )}
          </div>
          <div className={style.CanvesDataTable}>
            <table className={style.CanvesMarkerTable}>
              {orderStatus?.map((el: OrderByStatusRetention, index: number) => (
                <tr key={index} className={`${theme}-tr`}>
                  <td className={style.CanvesMarkerInner}>
                    <span
                      className={style.MarkerCanves}
                      style={{ backgroundColor: el.color }}
                    ></span>
                  </td>
                  <td>{el?.status}</td>
                  <td>{formatInput(el?.count)}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>
        {!orderStatus?.length ? <NoData /> : ""}
      </div>
    </div>
  );
}

export default OrderByStatus;
