// AppLayout.spec.tsx
import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import App from "@/components/Layout/AppLayout";
import "@contentful/react-apps-toolkit";

// Mock Contentful hooks
jest.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: () => ({
    parameters: {
      installation: {
        companyName: "Mock Company",
        companyLogoUrl: "/mock/logo.png",
      },
    },
    ids: { space: "mockSpaceId" },
  }),
  useCMA: () => ({}),
}));

const mockStore = configureStore([]);
const initialState = {
  loaderSlice: { loading: false },
  themeSlice: { theme: "light" },
};
const store = mockStore(initialState);

describe("AppLayout component", () => {
  it("renders without crashing", () => {
    const { getByText } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(getByText("Mock Company")).toBeInTheDocument();
  });
});
