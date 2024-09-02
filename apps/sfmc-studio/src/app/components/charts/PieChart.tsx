"use client";
import { PieChartType } from "@/lib/types/chart";
import { formatInput } from "@/lib/utils/common";
import { Pie } from "@ant-design/plots";
import React, { FC, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";

const PieChart: FC<PieChartType> = ({
  data,
  angleField,
  colorField,
  innerRadius,
  width,
  height,
}) => {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const config = useMemo(() => {
    return {
      data: data,
      angleField: angleField,
      colorField: colorField,
      innerRadius: innerRadius,
      width: width,
      height: height,
      style: {
        fill: (d: any) => d.color,
      },
      legend: false,
      tooltip: (d: any, index: number, data: any[]) => {
        let sum = data.reduce((a: number, b: any) => a + b[angleField], 0);
        let percentage = `${((d[angleField] * 100) / sum).toFixed(0)}%`;

        return {
          color: data[index].color,
          name: data[index][colorField],
          value: percentage,
        };
      },
    };
  }, [data, theme]);
  return <Pie {...config} />;
};

export default PieChart;
