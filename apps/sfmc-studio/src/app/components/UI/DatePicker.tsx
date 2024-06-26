"use client";
import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { DatePickerProps } from "antd";
import { Button, DatePicker, Space } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import moment from "moment";
import { dateRange } from "src/app/redux/slices/dateSlice";
import { useAppDispatch, useAppSelector } from "src/app/redux/hooks";
import Dropdown from "../UI/Dropdown";
import type { MenuProps } from "antd";
import { customDateRange, getDateRange } from "@/lib/utils/common";
import { showError } from "src/app/redux/slices/notificationSlice";

dayjs.extend(customParseFormat);
const { RangePicker } = DatePicker;
const dateFormat = "DD-MM-YYYY";

const items: MenuProps["items"] = customDateRange.map(
  (range: string, index: number) => ({
    key: String(index),
    label: range,
  })
);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { themeSlice, dateSlice }: any = useAppSelector((state) => state);
  // const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>(
    customDateRange[3] || ""
  );
  const rangePickerRef = useRef<any>(null);
  const [custom, setCustom] = useState<boolean>(false);

  const [endStartDate, setEndStartDate] = useState<any>({
    startDate: "",
    endDate: "",
  });

  const checkDate = (
    value: DatePickerProps["value"] | RangePickerProps["value"],
    dateString: [string, string] | string
  ) => {
    let startDate = moment
      .utc(dateString[0], "DD-MM-YYYY")
      .startOf("day")
      .toDate();
    let endDate = moment.utc(dateString[1], "DD-MM-YYYY").endOf("day").toDate();
    setCustom(true);
    setEndStartDate({ startDate: startDate, endDate: endDate });
  };

  const applyDateFilter = () => {
    if (endStartDate.startDate && endStartDate.endDate) {
      dispatch(dateRange(endStartDate));
    } else if (!dateSlice.dateRange.startDate && !dateSlice.dateRange.endDate) {
      dispatch(
        showError({
          showAlert: true,
          description: "Please select a date range to continue.",
          type: "error",
        })
      );
    }
  };

  // Handle Date Dropdown
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const clickedItem: any = items?.find((item: any) => item.key === e.key);

    setSelectedItem(clickedItem?.label || "");
    // setSelectedTimeFrame(e.key || "");
    let dateRange: any = getDateRange(e.key);

    if (!dateRange && rangePickerRef.current) {
      rangePickerRef.current?.nativeElement.click();
      if (endStartDate.startDate && endStartDate.endDate) {
        setEndStartDate({ startDate: "", endDate: "" });
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
            ? `${moment
                .utc(endStartDate.startDate, "DD-MM-YYYY")
                .startOf("day")
                .format("MMM DD,YYYY")} - ${moment
                .utc(endStartDate.endDate, "DD-MM-YYYY")
                .startOf("day")
                .format("MMM DD,YYYY")}`
            : selectedItem
        }
        items={items}
      />

      <Space direction="vertical" size={12}>
        <RangePicker
          ref={rangePickerRef}
          allowClear={false}
          value={[
            endStartDate.endDate
              ? dayjs(endStartDate.endDate, "DD-MM-YYYY").endOf("day")
              : null,
            endStartDate.startDate
              ? dayjs(endStartDate.startDate, "DD-MM-YYYY").startOf("day")
              : null,
          ]}
          format={dateFormat}
          maxDate={dayjs()}
          minDate={dayjs().subtract(6, "months")}
          onChange={checkDate}
          inputReadOnly
          popupClassName={`${themeSlice.theme}-datebg`}
        />
      </Space>

      <Button
        type="primary"
        onClick={applyDateFilter}
        className="DateApplyButton"
      >
        Apply
      </Button>
    </>
  );
};

export default App;
