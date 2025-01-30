import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(relativeTime);

export type dateStartEnd = { startDate: Date; endDate: Date };

const initialState = {
  dateRange: {
    startDate: dayjs.utc().subtract(1, "month").startOf("day").toDate(),
    endDate: dayjs.utc().endOf("day").toDate(),
  },
  isTwentyFourHr: false,
};

export const dateSlice = createSlice({
  name: "date",
  initialState,
  reducers: {
    dateRange(state, action: PayloadAction<dateStartEnd>) {
      state.dateRange = action.payload;
    },
    updateTwentyFour(state, action: PayloadAction<boolean>) {
      state.isTwentyFourHr = action.payload;
    },
  },
});

export const { dateRange, updateTwentyFour } = dateSlice.actions;
export default dateSlice.reducer;
