"use client";
import { MultiLineChartType } from "@/lib/types/chart";
import { formatInput } from "@/lib/utils/common";
import { commonChartConfig } from "@/lib/utils/dashboards";
import { multiLineChart } from "@/lib/utils/getColor";
import { Line } from "@ant-design/plots";
import React, { FC, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { themeTextColor } from "@/lib/Constants";
import dayjs from "dayjs";

const MultiLineChart: FC<MultiLineChartType> = ({
  data,
  yField,
  colorField,
  legend,
}) => {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const config = useMemo(() => {
    return {
      data: data,
      xField: ((d: any) => new Date(d.date)) as unknown as string,
      yField: yField,
      colorField: colorField,
      height: 300,
      style: {
        lineWidth: 3,
      },
      scale: { color: { range: multiLineChart } },
      legend: {
        color: legend,
      },
      axis: {
        x: {
          line: true,
          lineLineWidth: 3,
          lineStroke: themeTextColor[theme as keyof typeof themeTextColor],
          grid: false,
          style: {
            labelTransform: "rotate(-52)",
            labelFormatter: (d: any) => {
              let date = dayjs(d).format("DD MMM YYYY");

              return commonChartConfig.dateFormatForGraph(date);
            },
          },
          tick: false,
          labelSpacing: 10,
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: "var(--primary-font), sans-serif",
        },
        y: {
          line: true,
          lineLineWidth: 3,
          lineStroke: themeTextColor[theme as keyof typeof themeTextColor],
          grid: false,
          labelFormatter: "~s",
          tick: false,
          labelSpacing: 10,
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: "var(--primary-font), sans-serif",
        },
      },
      tooltip: (d: any, index: number, data: any[]) => ({
        color: data[index].color,
        value: `${formatInput(
          data[index].revenue,
          data?.[index]?.CurrencyIsoCode
        )}`,
      }),
    };
  }, [data, theme]);
  return <Line {...config} />;
};

export default MultiLineChart;
