import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import CustomTable from "../../src/app/components/UI/CustomTable"; //
import { useAppSelector } from "../../src/app/redux/hooks";
import { formatInput } from "@/lib/utils/common";

// Mocking the store and selector
const mockStore = configureStore([]);
const initialState = {
  themeSlice: {
    theme: "light",
  },
};

jest.mock("../../src/app/redux/hooks", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../../src/app/lib/utils/common", () => ({
  formatInput: jest.fn(),
}));

describe("CustomTable Component", () => {
  const store = mockStore(initialState);

  beforeEach(() => {
    (useAppSelector as jest.Mock).mockClear();
    (formatInput as jest.Mock).mockClear();
  });

  it("renders table with data and columns", () => {
    (useAppSelector as jest.Mock).mockReturnValue("light");
    (formatInput as jest.Mock).mockReturnValue("100");

    const data = [
      { id: "1", no: 1, name: "Item 1", clicks: 10, sents: 5, unique: 20 },
      { id: "2", no: 2, name: "Item 2", clicks: 15, sents: 8, unique: 30 },
    ];
    const columns = [
      { title: "No", dataIndex: "no", key: "no" },
      { title: "Name", dataIndex: "name", key: "name" },
      { title: "Unique", dataIndex: "unique", key: "unique" },
    ];

    render(
      <Provider store={store}>
        <CustomTable data={data} columns={columns} showTotal={true} />
      </Provider>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders correct row class based on theme", () => {
    (useAppSelector as jest.Mock).mockReturnValue("dark");

    const data = [
      { id: "1", no: 1, name: "Item 1", clicks: 10, sents: 5, unique: 20 },
    ];
    const columns = [{ title: "No", dataIndex: "no", key: "no" }];

    const { container } = render(
      <Provider store={store}>
        <CustomTable data={data} columns={columns} showTotal={false} />
      </Provider>
    );

    expect(container.querySelector(".table-row-dark")).toBeInTheDocument();
  });

  it("does not show total when showTotal is false", () => {
    (useAppSelector as jest.Mock).mockReturnValue("light");
    (formatInput as jest.Mock).mockReturnValue("100");

    const data = [
      { id: "1", no: 1, name: "Item 1", clicks: 10, sents: 5, unique: 20 },
    ];
    const columns = [{ title: "No", dataIndex: "no", key: "no" }];

    render(
      <Provider store={store}>
        <CustomTable data={data} columns={columns} showTotal={false} />
      </Provider>
    );

    expect(screen.queryByText("Total")).toBeNull();
  });
});
