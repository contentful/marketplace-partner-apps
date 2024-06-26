import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifi: {
    showAlert: false,
    message: "",
    description: "",
    type: "",
  },
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showError(state, action: PayloadAction<any>) {
      state.notifi = action.payload;
    },
  },
});

export const { showError } = notificationSlice.actions;

export default notificationSlice.reducer;
