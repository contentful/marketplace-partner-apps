import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Pie } from "@ant-design/plots";
import PieChart from "@/components/charts/PieChart";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

const mockStore = configureStore([]);
const initialState = {
  themeSlice: { theme: "light" },
};

jest.mock("@ant-design/plots", () => ({
  Pie: jest.fn(() => <div>Pie Chart Mock</div>),
}));

describe("PieChart", () => {
  const store = mockStore(initialState);

  const defaultProps = {
    data: [
      { angleField: 30, colorField: "A", color: "blue" },
      { angleField: 70, colorField: "B", color: "red" },
    ],
    angleField: "angleField",
    colorField: "colorField",
    innerRadius: 0.5,
    width: 400,
    height: 400,
  };

  beforeEach(() => {
    (Pie as unknown as jest.Mock).mockClear();
  });

  it("renders the Pie chart with correct props", () => {
    render(
      <Provider store={store}>
        <PieChart {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText("Pie Chart Mock")).toBeInTheDocument();
  });

  it("passes correct config to Pie component", () => {
    render(
      <Provider store={store}>
        <PieChart {...defaultProps} />
      </Provider>
    );

    const actualCalls = (Pie as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];

    expect(actualConfig).toEqual(
      expect.objectContaining({
        data: defaultProps.data,
        angleField: defaultProps.angleField,
        colorField: defaultProps.colorField,
        innerRadius: defaultProps.innerRadius,
        width: defaultProps.width,
        height: defaultProps.height,
        style: {
          fill: expect.any(Function),
        },
        legend: false,
        tooltip: expect.any(Function),
      })
    );
  });

  it("checks the style property for fill function", () => {
    render(
      <Provider store={store}>
        <PieChart {...defaultProps} />
      </Provider>
    );

    const pieMock = Pie as unknown as jest.Mock;
    const pieConfig = pieMock.mock.calls[0][0];
    const fillFunction = pieConfig.style.fill;

    expect(fillFunction(defaultProps.data[0])).toBe("blue");

    expect(fillFunction(defaultProps.data[1])).toBe("red");
  });

  it("formats the tooltip text correctly", () => {
    render(
      <Provider store={store}>
        <PieChart {...defaultProps} />
      </Provider>
    );

    const pieMock = Pie as unknown as jest.Mock;
    const pieConfig = pieMock.mock.calls[0][0];
    const tooltipFunction = pieConfig.tooltip;

    const mockData = defaultProps.data;

    const tooltipText1 = tooltipFunction(mockData[0], 0, mockData);
    const expectedTooltipText1 = {
      color: "blue",
      name: "A",
      value: "30%",
    };
    expect(tooltipText1).toEqual(expectedTooltipText1);

    const tooltipText2 = tooltipFunction(mockData[1], 1, mockData);
    const expectedTooltipText2 = {
      color: "red",
      name: "B",
      value: "70%",
    };
    expect(tooltipText2).toEqual(expectedTooltipText2);
  });
});
