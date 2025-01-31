import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type activeRouteType = {
  _id: string;
  heading: string;
  menulabel: string;
  order: number;
};

const initialState = {
  activeRoute: {
    _id: '',
    heading: '',
    menulabel: '',
    order: 0,
  },
  update: false,
  menu: [],
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    changeRoute(state, action: PayloadAction<activeRouteType>) {
      state.activeRoute = action.payload;
    },
    fetchUpdated(state, action: PayloadAction<boolean>) {
      state.update = action.payload;
    },
    addMenuArr(state, action: PayloadAction<any>) {
      state.menu = action.payload;
    },
  },
});

export const { changeRoute, fetchUpdated, addMenuArr } = navigationSlice.actions;

export default navigationSlice.reducer;
