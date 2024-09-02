import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Line } from "@ant-design/plots";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { themeTextColor } from "@/lib/Constants";

const mockStore = configureStore([]);
const initialState = {
  themeSlice: {
    theme: "light",
  },
};

jest.mock("@ant-design/plots", () => ({
  Line: jest.fn(() => <div>Multi Line Chart Mock</div>),
}));

describe("MultiLineChart", () => {
  const store = mockStore(initialState);

  const defaultProps = {
    data: [
      { date: "2024-01-01", yField: 30, colorField: "A", color: "blue" },
      { date: "2024-01-02", yField: 70, colorField: "B", color: "red" },
    ],
    xField: "date",
    yField: "yField",
    colorField: "colorField",
    legend: "top",
    showAnnotations: true,
    height: 300,
    labelFormatter: (datum: string) => `${datum} (formatted)`,
  };

  beforeEach(() => {
    (Line as unknown as jest.Mock).mockClear();
  });

  it("renders the MultiLineChart with correct props", () => {
    render(
      <Provider store={store}>
        <MultiLineChart {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText("Multi Line Chart Mock")).toBeInTheDocument();
  });

  it("passes correct config to Line component", () => {
    render(
      <Provider store={store}>
        <MultiLineChart {...defaultProps} />
      </Provider>
    );

    const actualCalls = (Line as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];

    expect(actualConfig).toEqual(
      expect.objectContaining({
        data: defaultProps.data,
        xField: expect.any(Function),
        yField: defaultProps.yField,
        colorField: defaultProps.colorField,
        height: defaultProps.height,
        style: {
          lineWidth: 3,
        },
        scale: {
          color: {
            range: expect.any(Array),
          },
        },
        legend: {
          color: defaultProps.legend,
        },
        axis: {
          x: expect.objectContaining({
            line: true,
            lineLineWidth: 3,
            lineStroke: themeTextColor["light"],
            grid: false,
            style: {
              labelTransform: "rotate(-52)",
              labelFormatter: expect.any(Function),
            },
            tick: false,
            labelSpacing: 10,
            labelFontSize: 14,
            labelFontWeight: 500,
            labelFill: themeTextColor["light"],
            labelOpacity: 1,
            labelFontFamily: "SFProDisplay",
          }),
          y: expect.objectContaining({
            line: true,
            lineLineWidth: 3,
            lineStroke: themeTextColor["light"],
            grid: false,
            labelFormatter: "~s",
            tick: false,
            labelSpacing: 10,
            labelFontSize: 14,
            labelFontWeight: 500,
            labelFill: themeTextColor["light"],
            labelOpacity: 1,
            labelFontFamily: "SFProDisplay",
          }),
        },
        tooltip: expect.any(Function),
      })
    );
  });

  it("correctly formats tooltip values", () => {
    render(
      <Provider store={store}>
        <MultiLineChart {...defaultProps} />
      </Provider>
    );

    const actualCalls = (Line as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];

    const mockData = [
      {
        date: "2024-01-01",
        yField: 30,
        colorField: "A",
        color: "blue",
        revenue: 100,
        CurrencyIsoCode: "USD",
      },
    ];

    const tooltipFunc = actualConfig.tooltip as (
      d: any,
      index: number,
      data: any[]
    ) => any;
    const tooltipResult = tooltipFunc(mockData[0], 0, mockData);

    expect(tooltipResult).toEqual({
      color: "blue",
      value: "USD100",
    });
  });

  it("formats x-axis labels correctly when dateShow is true", () => {
    const propsWithDateShow = {
      ...defaultProps,
      dateShow: true,
    };

    render(
      <Provider store={store}>
        <MultiLineChart {...propsWithDateShow} />
      </Provider>
    );

    const actualCalls = (Line as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];
    const xAxisStyle = actualConfig.axis?.x?.style;

    expect(xAxisStyle?.labelFormatter).toBeInstanceOf(Function);
    expect(
      xAxisStyle?.labelFormatter("2024-01-01", 0, defaultProps.data, {})
    ).toContain("01 Jan 2024");
  });
});
