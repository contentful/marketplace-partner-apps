export type BarChartType = {
  data: any;
  toolTipText: string;
  xField: string;
  yField: string;
  labelText: string;
  maxWidth: number;
  axisYTitle: string;
  height: number;
};

export type LineChartType = {
  data: any;
  xField: string;
  yField: string;
  dateShow: boolean;
  axisYTitle: string;
  axisXTitle: string;
  toolTipText: string;
  showAnnotations: boolean;
  height: number;
  labelFormatter: boolean;
};

export type MultiLineChartType = {
  data: any;
  yField: string;
  colorField: string;
  legend: any;
};

export type PieChartType = {
  data: any;
  angleField: string;
  colorField: string;
  innerRadius: number;
  width: number;
  height: number;
};
