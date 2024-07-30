import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: "light",
};

const themeSlice = createSlice({
  name: "themeSlice",
  initialState,
  reducers: {
    themeChange(state, action: PayloadAction<string>) {
      state.theme = action.payload;
    },
  },
});

export const { themeChange } = themeSlice.actions;
export default themeSlice.reducer;
