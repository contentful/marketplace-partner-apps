import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import navigationSlice from "./slices/navigationSlice";
import dateSlice from "./slices/dateSlice";
import loadersSlice from "./slices/loadersSlice";
import authSlice from "./slices/authSlice";
import themeSlice from "./slices/themeSlice";

let rootReducer: any = {
  navigationSlice: navigationSlice,
  dateSlice: dateSlice,
  loaderSlice: loadersSlice,
  authSlice: authSlice,
  themeSlice: themeSlice,
};

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["themeSlice"],
};

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers(rootReducer)
);

export const setupStore = () => {
  return configureStore({
    reducer: persistedReducer,
  });
};

const store = setupStore();
const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export { store, persistor };
