import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import LineChart from "@/components/charts/LineChart";
import { Line } from "@ant-design/plots";
import { themeTextColor } from "@/lib/Constants";

const mockStore = configureMockStore();

const mockData = [
  { x: "2023-08-01", y: 30 },
  { x: "2023-08-02", y: 40 },
];

// Mock the @ant-design/plots
jest.mock("@ant-design/plots", () => ({
  Line: jest.fn(({ tooltip }) => {
    if (tooltip) {
      const tooltipResult = tooltip({ x: "2023-08-01", y: 30 }, 0, mockData);
    }
    return <div>Line Chart Mock</div>;
  }),
}));

// Mock the formatInput function
jest.mock("../../src/app/lib/utils/common", () => ({
  formatInput: jest.fn((value) => `USD${value}`),
}));

describe("LineChart Component", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      themeSlice: { theme: "light" },
    });
  });

  it("renders LineChart with given props", () => {
    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={true}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={false}
          height={300}
          labelFormatter={true}
        />
      </Provider>
    );

    expect(screen.getByText("Line Chart Mock")).toBeInTheDocument();
  });

  it("should render LineChart with different theme", () => {
    store = mockStore({
      themeSlice: { theme: "dark" },
    });

    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={false}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={true}
          height={200}
          labelFormatter={true}
        />
      </Provider>
    );

    expect(screen.getByText("Line Chart Mock")).toBeInTheDocument();
  });

  it("correctly applies labelFormatter", () => {
    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={false}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={false}
          height={300}
          labelFormatter={true}
        />
      </Provider>
    );

    expect(screen.getByText("Line Chart Mock")).toBeInTheDocument();
  });

  it("renders with annotations", () => {
    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={true}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={true}
          height={300}
          labelFormatter={true}
        />
      </Provider>
    );

    expect(screen.getByText("Line Chart Mock")).toBeInTheDocument();
  });

  it("correctly formats tooltip values", () => {
    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={true}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={true}
          height={300}
          labelFormatter={true}
        />
      </Provider>
    );

    // Extract the actual calls to Line
    const actualCalls = (Line as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];

    // Extract the tooltip function from the config
    const tooltipFunc = actualConfig.tooltip as (
      d: any,
      index: number,
      data: any[]
    ) => any;

    // Test with mock data
    const mockDataTool = [
      {
        date: "2024-01-01",
        y: 30,
        colorField: "A",
        color: "blue",
        revenue: 100,
        CurrencyIsoCode: "USD",
      },
    ];

    const tooltipResult = tooltipFunc(mockDataTool[0], 0, mockDataTool);

    // Assert the expected result
    expect(tooltipResult).toEqual({
      name: "Tooltip",
      value: "USD30",
    });
  });

  it("correctly configures axis properties", () => {
    render(
      <Provider store={store}>
        <LineChart
          data={mockData}
          xField="x"
          yField="y"
          dateShow={true}
          axisYTitle="Y Axis"
          axisXTitle="X Axis"
          toolTipText="Tooltip"
          showAnnotations={false}
          height={300}
          labelFormatter={true}
        />
      </Provider>
    );

    const actualCalls = (Line as unknown as jest.Mock).mock.calls;
    const actualConfig = actualCalls[0][0];

    const axisConfig = actualConfig.axis;

    expect(axisConfig.y).toEqual({
      title: "Y Axis",
      titleFontWeight: 500,
      titleFontSize: 12,
      titleStrokeOpacity: 0.4,
      titleFill: themeTextColor["light"],
      titleStroke: themeTextColor["light"],
      line: true,
      lineLineWidth: 1.7,
      lineStroke: themeTextColor["light"],
      grid: false,
      labelFormatter: "~s",
      labelFontSize: 14,
      labelFontWeight: 500,
      labelFill: themeTextColor["light"],
      labelOpacity: 1,
      labelFontFamily: "var(--primary-font), sans-serif",
      tick: false,
      labelSpacing: 10,
    });

    // Check X axis configuration
    expect(axisConfig.x).toEqual({
      title: "X Axis",
      titleSpacing: 20,
      titleFontWeight: 100,
      titleStrokeOpacity: 0.3,
      titleFontSize: 12,
      titleFill: "red",
      titleStroke: "red",
      line: true,
      lineLineWidth: 1.7,
      lineStroke: themeTextColor["light"],
      grid: false,
      labelFontSize: 14,
      labelFontWeight: 500,
      labelFill: themeTextColor["light"],
      labelOpacity: 1,
      labelFontFamily: "var(--primary-font), sans-serif",
      style: {
        labelTransform: "rotate(-50)",
        labelFormatter: expect.any(Function),
      },
      tick: false,
      labelSpacing: 10,
    });
  });
});
