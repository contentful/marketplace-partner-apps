"use client";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import Loader from "@/components/Loader/Loader";
 
const mockStore = configureStore([]);
 
const initialState = {
  loaderSlice: {
    loading: false,
  },
};
 
describe("Loader component", () => {
  const mockUseAppSelector = jest.fn();
  
  jest.mock("../../src/app/redux/hooks", () => ({
    useAppSelector: (selector: (state: typeof initialState) => any) =>
      selector(initialState),
  }));
 
  beforeEach(() => {
    mockUseAppSelector.mockClear();
  });
 
  test("renders children when loading is false", () => {
    const store = mockStore(initialState);
    render(
      <Provider store={store}>
        <Loader>
          <div>Test Content</div>
        </Loader>
      </Provider>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
})