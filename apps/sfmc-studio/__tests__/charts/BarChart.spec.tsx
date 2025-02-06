import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import BarChart from "@/components/charts/BarChart";
import { BarChartType } from "@/lib/types/chart";
import { Bar } from "@ant-design/plots";
import { themeTextColor } from "@/lib/Constants";
import { commonChartConfig } from "@/lib/utils/dashboards";

// Mock Store
const mockStore = configureStore([]);
const initialState = {
  themeSlice: {
    theme: "light",
  },
};

// Mocking the Bar component
jest.mock("@ant-design/plots", () => ({
  Bar: jest.fn(({ label, style, axis }) => {
    const fillFunction = (d: any) => d.color;
    const strokeFunction = (d: any) => d.color;

    return (
      <div>
        Bar Chart Mock
        {label && (
          <div data-testid="label-test">
            {fillFunction({ color: "blue" })}
            {strokeFunction({ color: "blue" })}
          </div>
        )}
        <div data-testid="style-test">
          Fill: {style.fill({ color: "blue" })}
          Stroke: {style.stroke({ color: "blue" })}
          Opacity: {style.opacity}
          MaxWidth: {style.maxWidth}
        </div>
        <div data-testid="axis-test">
          Y Axis Title: {axis.y.title}X Axis Label Spacing:{" "}
          {axis.x.labelSpacing}
        </div>
      </div>
    );
  }),
}));

const getDxForOutsideLbl = (number: number) => {
  const multiplierValue = 10;
  return String(number).length * multiplierValue;
};

describe("BarChart", () => {
  const store = mockStore(initialState);

  const defaultProps: BarChartType = {
    data: [{ x: "Jan", y: 3000000, color: "blue", labelColor: "red" }],
    xField: "x",
    yField: "y",
    labelText: "Label",
    maxWidth: 600,
    height: 400,
    axisYTitle: "Y Axis Title",
    toolTipText: "Tooltip Text",
  };

  it("renders the Bar chart with correct props", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText("Bar Chart Mock")).toBeInTheDocument();
  });

  it("passes correct config to Bar component", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    expect(barConfig).toMatchObject({
      data: defaultProps.data,
      xField: defaultProps.xField,
      yField: defaultProps.yField,
      label: expect.objectContaining({
        text: defaultProps.labelText,
        style: expect.objectContaining({
          fill: expect.any(Function),
          fontWeight: 900,
          fontSize: 12,
          fillOpacity: 1,
          opacity: 1,
          dx: expect.any(Function),
          textAnchor: expect.any(Function),
        }),
      }),
      style: expect.objectContaining({
        fill: expect.any(Function),
        stroke: expect.any(Function),
        opacity: 10,
        maxWidth: defaultProps.maxWidth,
      }),
      axis: expect.objectContaining({
        y: expect.objectContaining({
          title: defaultProps.axisYTitle,
          titleFontWeight: 500,
          titleFontSize: 12,
          titleStrokeOpacity: 0.4,
          titleFill:
            themeTextColor[
              initialState.themeSlice.theme as keyof typeof themeTextColor
            ],
          titleStroke:
            themeTextColor[
              initialState.themeSlice.theme as keyof typeof themeTextColor
            ],
          style: {
            labelTransform: "rotate(0)",
          },
          grid: false,
          labelFontSize: 14,
          labelFontWeight: 500,
          labelFill:
            themeTextColor[
              initialState.themeSlice.theme as keyof typeof themeTextColor
            ],
          labelOpacity: 1,
          labelFontFamily: "var(--primary-font), sans-serif",
          tick: false,
          labelFormatter: expect.any(Function),
        }),
        x: expect.objectContaining({
          labelSpacing: 20,
          labelFormatter: expect.any(Function),
        }),
      }),
      height: defaultProps.height,
      tooltip: expect.any(Function),
      animate: expect.objectContaining({
        enter: { type: "growInY" },
      }),
    });
  });

  it("calculates dx correctly based on yField value", () => {
    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const dxFunction = barConfig.label.style.dx;

    const data = defaultProps.data;
    const maxYValue = Math.max(...data.map((d: any) => d.y));

    expect(dxFunction(data[0], 0, data)).toBe(-10);

    const smallValue = { ...data[0], y: 10 };
    expect(dxFunction(smallValue, 0, data)).toBe(
      getDxForOutsideLbl(smallValue.y)
    );
  });

  it("calculates textAnchor correctly based on yField value", () => {
    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const textAnchorFunction = barConfig.label.style.textAnchor;
    const data = defaultProps.data;

    expect(textAnchorFunction(data[0], 0, data)).toBe("right");

    const smallValue = { ...data[0], y: 10 };
    expect(textAnchorFunction(smallValue, 0, data)).toBe("start");
  });

  it("calculates fill color correctly based on theme and yField value", () => {
    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const fillFunction = barConfig.label.style.fill;

    expect(fillFunction(defaultProps.data[0], 0, defaultProps.data)).toBe(
      "red"
    );

    const darkThemeStore = mockStore({
      themeSlice: {
        theme: "dark",
      },
    });

    render(
      <Provider store={darkThemeStore}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const darkBarMock = Bar as unknown as jest.Mock;
    const darkBarConfig = darkBarMock.mock.calls[0][0];
    const darkFillFunction = darkBarConfig.label.style.fill;

    expect(darkFillFunction(defaultProps.data[0], 0, defaultProps.data)).toBe(
      "red"
    );
  });

  it("checks the style properties for fill, stroke, opacity, and maxWidth", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const style = barConfig.style;

    expect(style.fill({ color: "blue" })).toBe("blue");
    expect(style.stroke({ color: "blue" })).toBe("blue");
    expect(style.opacity).toBe(10);
    expect(style.maxWidth).toBe(defaultProps.maxWidth);
  });

  it("checks the axis configuration", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const axis = barConfig.axis;

    expect(axis.y.title).toBe(defaultProps.axisYTitle);
    expect(axis.y.titleFontWeight).toBe(500);
    expect(axis.y.titleFontSize).toBe(12);
    expect(axis.y.titleStrokeOpacity).toBe(0.4);
    expect(axis.y.titleFill).toBe(
      themeTextColor[
        initialState.themeSlice.theme as keyof typeof themeTextColor
      ]
    );
    expect(axis.y.titleStroke).toBe(
      themeTextColor[
        initialState.themeSlice.theme as keyof typeof themeTextColor
      ]
    );
    expect(axis.y.labelFontSize).toBe(14);
    expect(axis.y.labelFontWeight).toBe(500);
    expect(axis.y.labelFill).toBe(
      themeTextColor[
        initialState.themeSlice.theme as keyof typeof themeTextColor
      ]
    );
    expect(axis.y.labelOpacity).toBe(1);
    expect(axis.y.labelFontFamily).toBe("var(--primary-font), sans-serif");
    expect(axis.y.tick).toBe(false);
    expect(axis.x.labelSpacing).toBe(20);
    expect(axis.x.labelFormatter).toBeInstanceOf(Function);
  });

  it("formats the tooltip text correctly", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const tooltipFunction = barConfig.tooltip;
    const tooltipText = tooltipFunction(
      defaultProps.data[0],
      0,
      defaultProps.data
    );

    const expectedTooltipText = {
      color: "blue",
      value: "3,000,000",
      name: "Tooltip Text",
    };

    expect(tooltipText).toEqual(expectedTooltipText);
  });

  it("formats the axis labels correctly", () => {
    render(
      <Provider store={store}>
        <BarChart {...defaultProps} />
      </Provider>
    );

    const barMock = Bar as unknown as jest.Mock;
    const barConfig = barMock.mock.calls[0][0];
    const yAxisFormatter = barConfig.axis.y.labelFormatter;
    const xAxisFormatter = barConfig.axis.x.labelFormatter;

    expect(yAxisFormatter(1000000)).toBe("1M");
    expect(yAxisFormatter(1500)).toBe("2K");
    expect(yAxisFormatter(500)).toBe("500");

    const exampleText = "Example";
    expect(xAxisFormatter(exampleText)).toBe(
      commonChartConfig.transformLegendText(exampleText, 15)
    );
  });
});
