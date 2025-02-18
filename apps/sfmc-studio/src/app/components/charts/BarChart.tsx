'use client';
import { themeTextColor } from '../../lib/Constants';
import { BarChartType } from '../../lib/types/chart';
import { formatInput } from '../../lib/utils/common';
import { commonChartConfig } from '../../lib/utils/dashboards';
import { Bar } from '@ant-design/plots';
import React, { FC, useMemo } from 'react';
import { useAppSelector } from '../../redux/hooks';

// We dynamically calculate dx based on the digits of the number
const getDxForOutsideLbl = (number: any) => {
  const multiplierValue = 10;
  return String(number).length * multiplierValue;
};
const BarChart: FC<BarChartType> = ({ data, xField, yField, labelText, maxWidth, height, axisYTitle, toolTipText }) => {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);

  const config = useMemo(() => {
    return {
      data: data,
      xField: xField,
      yField: yField,
      label: {
        text: labelText,
        style: {
          textAnchor: (d: any, index: number, data: any) => (+d[yField] >= +data[0][yField] / 2 ? 'right' : 'start'),
          fill: (d: any, index: number, data: any) => {
            let color;
            +d[yField] >= +data[0][yField] / 2 ? (color = d.labelColor) : theme === 'light' ? (color = 'black') : (color = 'white');
            return color;
          },
          dx: (d: any, index: number, data: any) => (+d[yField] >= +data[0][yField] / 2 ? -10 : getDxForOutsideLbl(+d[yField])),
          fontWeight: 900,
          fontSize: 12,
          fillOpacity: 1,
          opacity: 1,
        },
      },
      style: {
        fill: (d: any) => d.color,
        stroke: (d: any) => d.color,
        opacity: 10,
        maxWidth: maxWidth,
      },
      axis: {
        y: {
          title: axisYTitle,
          titleFontWeight: 500,
          titleFontSize: 12,
          titleStrokeOpacity: 0.4,
          titleFill: themeTextColor[theme as keyof typeof themeTextColor],
          titleStroke: themeTextColor[theme as keyof typeof themeTextColor],
          style: {
            labelTransform: 'rotate(0)',
          },
          grid: false,
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: 'var(--primary-font), sans-serif',
          tick: false,
          labelFormatter: (value: any) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(0)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}K`;
            } else {
              return value.toString();
            }
          },
        },
        x: {
          labelSpacing: 20,
          labelFormatter: (d: string) => commonChartConfig.transformLegendText(d, 15),
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: 'var(--primary-font), sans-serif',
          grid: false,
          tick: false,
        },
      },
      height: height,
      tooltip: (d: any, index: number, data: any[]) => ({
        color: data[index].color,
        value: `${formatInput(data[index][yField], data?.[index]?.CurrencyIsoCode)}`,
        name: toolTipText,
      }),
      animate: {
        enter: { type: 'growInY' },
      },
    };
  }, [data, theme]);

  return <Bar {...config} />;
};

export default BarChart;
