import { notification as api } from 'antd';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // For custom parsing
import utc from 'dayjs/plugin/utc'; // For UTC support if needed

// Extend dayjs with plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const commonChartConfig = {
  dateFormatForGraph: (date: any, parseFormat: any = 'DD MMM YYYY', requiredFormat: any = 'DD MMM YYYY') => {
    const formattedDate = dayjs(date).format(requiredFormat);
    return formattedDate;
  },
  dateFieldLabelTransform: 'rotate(-50)',

  capitalizeLabel: (elm: any, field: string) => elm[field].charAt(0).toUpperCase() + elm[field].slice(1),

  transformLegendText: (label: any, sliceLength: number = 5) => {
    if (label?.length > sliceLength) {
      return label.slice(0, sliceLength).concat('...');
    }
    return label;
  },
  handleMouseEnter: (e: any, sliceLength: number = 5) => {
    if (e?.attributes?.labelText.length > sliceLength) return e?.__data__?.id;
    else return '';
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

export const openNotification = ({
  type,
  theme,
  message,
  description,
}: {
  type: 'success' | 'info' | 'warning' | 'error';
  theme: string;
  message?: string;
  description?: string;
}) => {
  api[type]({
    className: `Noti-${type} ${theme}`,
    message: message,
    description: description,
    placement: 'topRight',
    duration: null,
  });
};
