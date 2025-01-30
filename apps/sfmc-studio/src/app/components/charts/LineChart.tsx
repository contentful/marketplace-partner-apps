'use client';
import { themeTextColor } from '@/lib/Constants';
import { LineChartType } from '@/lib/types/chart';
import { formatInput } from '@/lib/utils/common';
import { commonChartConfig } from '@/lib/utils/dashboards';
import { Line } from '@ant-design/plots';
import { FC, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';

const LineChart: FC<LineChartType> = ({ data, xField, yField, dateShow, axisYTitle, axisXTitle, toolTipText, showAnnotations, height, labelFormatter }) => {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const config = useMemo(() => {
    return {
      data: data,
      xField: dateShow ? (((d: any) => commonChartConfig.dateFormatForGraph(d[xField])) as unknown as string) : xField,
      yField: yField,
      height: height,
      style: {
        lineWidth: 3,
        stroke: '#036FE3',
      },
      legend: false,
      annotations: showAnnotations
        ? [
            {
              type: 'text',
              xField: xField,
              yField: yField,
              style: {
                fontSize: 14,
                text: (d: any) => `${formatInput(d[yField])}`,
                fill: '#036FE3',
                dy: -10,
                dx: -12,
              },
              tooltip: false,
            },
          ]
        : [],
      axis: {
        y: {
          title: axisYTitle,
          titleFontWeight: 500,
          titleFontSize: 12,
          titleStrokeOpacity: 0.4,
          titleFill: themeTextColor[theme as keyof typeof themeTextColor],
          titleStroke: themeTextColor[theme as keyof typeof themeTextColor],
          line: true,
          lineLineWidth: 1.7,
          lineStroke: themeTextColor[theme as keyof typeof themeTextColor],
          grid: false,
          labelFormatter: '~s',
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: 'SFProDisplay',
          tick: false,
          labelSpacing: 10,
        },
        x: {
          title: axisXTitle,
          titleSpacing: 20,
          titleFontWeight: 100,
          titleStrokeOpacity: 0.3,
          titleFontSize: 12,
          titleFill: 'red',
          titleStroke: 'red',
          line: true,
          lineLineWidth: 1.7,
          lineStroke: themeTextColor[theme as keyof typeof themeTextColor],
          grid: false,
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill: themeTextColor[theme as keyof typeof themeTextColor],
          labelOpacity: 1,
          labelFontFamily: 'SFProDisplay',
          style: {
            labelTransform: commonChartConfig.dateFieldLabelTransform,
            labelFormatter: labelFormatter
              ? (datum: string, index: number, d: any, Vector: any) => datum + ',' + commonChartConfig.dateFormatForGraph(data[index].Date, 'YYYY-MM-DD')
              : (datum: string, index: number, d: any, Vector: any) => datum,
          },
          tick: false,
          labelSpacing: 10,
        },
      },
      tooltip: (d: any, index: number, data: any[]) => ({
        value: `${formatInput(data[index][yField])}`,
        name: toolTipText,
      }),
    };
  }, [data, theme]);

  return <Line {...config} />;
};

export default LineChart;
