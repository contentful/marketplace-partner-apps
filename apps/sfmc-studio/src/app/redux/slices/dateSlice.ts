import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import moment from "moment";

export type dateStartEnd = { startDate: Date; endDate: Date };

const initialState = {
  dateRange: {
    startDate: moment().utc().subtract(1, "month").startOf("day").toDate(),
    endDate: moment().utc().endOf("day").toDate(),
  },
};

export const dateSlice = createSlice({
  name: "date",
  initialState,
  reducers: {
    dateRange(state, action: PayloadAction<dateStartEnd>) {
      state.dateRange = action.payload;
    },
  },
});

export const { dateRange } = dateSlice.actions;
export default dateSlice.reducer;
