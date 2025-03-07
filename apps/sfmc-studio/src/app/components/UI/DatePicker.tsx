'use client';
import React, { useRef, useState } from 'react';
import type { DatePickerProps } from 'antd';
import { Button, DatePicker, Space } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import { dateRange, updateTwentyFour } from '../../redux/slices/dateSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import Dropdown from '../UI/Dropdown';
import type { MenuProps } from 'antd';
import { customDateRange, getDateRange } from '../../lib/utils/common';
import { openNotification } from '../../lib/utils/dashboards';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
const { RangePicker } = DatePicker;
const dateFormat = 'DD-MM-YYYY';

const items: MenuProps['items'] = customDateRange.map((range: string, index: number) => ({
  key: String(index),
  label: range,
}));

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { themeSlice, dateSlice }: any = useAppSelector((state) => state);
  // const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>(customDateRange[3] || '');
  const rangePickerRef = useRef<any>(null);
  const [custom, setCustom] = useState<boolean>(false);

  const [endStartDate, setEndStartDate] = useState<any>({
    startDate: '',
    endDate: '',
  });

  const checkDate = (value: DatePickerProps['value'] | RangePickerProps['value'], dateString: [string, string] | string) => {
    let startDate = dayjs.utc(dateString[0], 'DD-MM-YYYY').startOf('day').toDate();
    let endDate = dayjs.utc(dateString[1], 'DD-MM-YYYY').endOf('day').toDate();
    setCustom(true);
    setEndStartDate({ startDate: startDate, endDate: endDate });
  };

  const applyDateFilter = () => {
    if (endStartDate.startDate && endStartDate.endDate) {
      if (selectedItem === customDateRange[0]) dispatch(updateTwentyFour(true));
      else dispatch(updateTwentyFour(false));
      dispatch(dateRange(endStartDate));
    } else if (!dateSlice.dateRange.startDate && !dateSlice.dateRange.endDate) {
      openNotification({
        message: '',
        description: 'Please select a date range to continue.',
        type: 'error',
        theme: themeSlice.theme,
      });
    }
  };

  // Handle Date Dropdown
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const clickedItem: any = items?.find((item: any) => item.key === e.key);

    setSelectedItem(clickedItem?.label || '');
    // setSelectedTimeFrame(e.key || "");
    let dateRange: any = getDateRange(e.key);

    if (!dateRange && rangePickerRef.current) {
      rangePickerRef.current?.nativeElement.click();
      if (endStartDate.startDate && endStartDate.endDate) {
        setEndStartDate({ startDate: '', endDate: '' });
        setCustom(false);
        setSelectedItem(customDateRange[6]);
      }
    } else {
      setEndStartDate({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setCustom(false);
    }
  };

  return (
    <>
      <Dropdown
        handleMenuClick={handleMenuClick}
        selectedItem={
          custom
            ? `${dayjs.utc(endStartDate.startDate).startOf('day').format('MMM DD,YYYY')} - ${dayjs
                .utc(endStartDate.endDate)
                .startOf('day')
                .format('MMM DD,YYYY')}`
            : selectedItem
        }
        items={items}
        theme={themeSlice.theme}
      />

      <Space direction="vertical" size={12}>
        <RangePicker
          ref={rangePickerRef}
          allowClear={false}
          value={[
            endStartDate.endDate ? dayjs(endStartDate.endDate, 'DD-MM-YYYY').endOf('day') : null,
            endStartDate.startDate ? dayjs(endStartDate.startDate, 'DD-MM-YYYY').startOf('day') : null,
          ]}
          format={dateFormat}
          maxDate={dayjs()}
          minDate={dayjs().subtract(6, 'months')}
          onChange={checkDate}
          inputReadOnly
          popupClassName={`${themeSlice.theme}-datebg`}
        />
      </Space>

      <Button type="primary" onClick={applyDateFilter} className="DateApplyButton">
        Apply
      </Button>
    </>
  );
};

export default App;
