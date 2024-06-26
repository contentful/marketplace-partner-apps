import moment from "moment";

export const commonChartConfig = {
  dateFormatForGraph: (
    date: any,
    parseFormat: any = "DD MMM YYYY",
    requiredFormat: any = "DD MMM YYYY"
  ) => moment(date, parseFormat).format(requiredFormat),
  dateFieldLabelTransform: "rotate(-50)",

  capitalizeLabel: (elm: any, field: string) =>
    elm[field].charAt(0).toUpperCase() + elm[field].slice(1),

  transformLegendText: (label: any, sliceLength: number = 5) => {
    if (label?.length > sliceLength) {
      return label.slice(0, sliceLength).concat("...");
    }
    return label;
  },
  handleMouseEnter: (e: any, sliceLength: number = 5) => {
    if (e?.attributes?.labelText.length > sliceLength) return e?.__data__?.id;
    else return "";
  },
  axisYLableFormatingBarChart: (value: any) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    } else {
      return value.toString();
    }
  },
};
