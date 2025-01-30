import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = { isAuth: false };
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsAuth(state, action: PayloadAction<boolean>) {
      state.isAuth = action.payload;
    },
  },
});

export const { setIsAuth } = authSlice.actions;
export default authSlice.reducer;
