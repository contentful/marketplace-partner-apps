import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = { loading: false };
export const loadingSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    loadingState(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { loadingState } = loadingSlice.actions;
export default loadingSlice.reducer;
