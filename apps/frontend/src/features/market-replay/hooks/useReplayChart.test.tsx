import { expect, it, describe, mock, beforeEach } from "bun:test";
import { render } from "@testing-library/react";
import React from "react";
import { useReplayChart } from "./useReplayChart";

/* lightweight-charts のモック化 */
const setDataMock = mock();
const fitContentMock = mock();
const applyOptionsMock = mock();
const removeMock = mock();
const createSeriesMarkersMock = mock();

const candlestickSeriesMock = {
  setData: setDataMock,
};

const chartMock = {
  addSeries: mock(() => candlestickSeriesMock),
  remove: removeMock,
  applyOptions: mock(applyOptionsMock),
  timeScale: mock(() => ({
    fitContent: fitContentMock,
  })),
};

mock.module("lightweight-charts", () => ({
  createChart: mock(() => chartMock),
  ColorType: { Solid: "Solid" },
  CandlestickSeries: "CandlestickSeries",
  createSeriesMarkers: createSeriesMarkersMock,
}));

/* テスト用コンポーネント */
function TestChartComponent({ candles, exactEventTimeJst }: { candles: unknown[], exactEventTimeJst?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { chartContainerRef } = useReplayChart({ candles: candles as any, exactEventTimeJst });
  return <div ref={chartContainerRef} style={{ width: '800px' }} />;
}

describe("useReplayChart", () => {
  const mockCandles = [
    { datetimeJst: "2026-04-01T10:00:00Z", open: 100, high: 110, low: 90, close: 105 },
    { datetimeJst: "2026-04-01T10:01:00Z", open: 105, high: 115, low: 100, close: 110 },
  ];

  beforeEach(() => {
    setDataMock.mockClear();
    fitContentMock.mockClear();
    applyOptionsMock.mockClear();
    removeMock.mockClear();
    createSeriesMarkersMock.mockClear();
  });

  it("コンポーネントのマウント時にチャートを初期化し、データをセットすること", () => {
    /* ## Arrange & Act ## */
    render(<TestChartComponent candles={mockCandles} />);

    /* ## Assert ## */
    expect(setDataMock).toHaveBeenCalled();
    const callArgs = setDataMock.mock.calls[0][0] as unknown[];
    expect((callArgs[0] as { time: number }).time).toBe(new Date(mockCandles[0].datetimeJst).getTime() / 1000);
    expect(fitContentMock).toHaveBeenCalled();
  });

  it("発表時刻が指定されている場合、マーカーを描画すること", () => {
    /* ## Arrange ## */
    const exactEventTimeJst = mockCandles[0].datetimeJst;

    /* ## Act ## */
    render(<TestChartComponent candles={mockCandles} exactEventTimeJst={exactEventTimeJst} />);

    /* ## Assert ## */
    expect(createSeriesMarkersMock).toHaveBeenCalled();
    const markerArgs = createSeriesMarkersMock.mock.calls[0][1] as { text: string }[];
    expect(markerArgs[0].text).toBe("発表時刻");
  });

  it("アンマウント時に chart.remove() が呼ばれること", () => {
    /* ## Arrange ## */
    const { unmount } = render(<TestChartComponent candles={mockCandles} />);

    /* ## Act ## */
    unmount();

    /* ## Assert ## */
    expect(removeMock).toHaveBeenCalled();
  });

  it("ウィンドウのリサイズ時に chart.applyOptions が呼ばれること", () => {
    /* ## Arrange ## */
    render(<TestChartComponent candles={mockCandles} />);

    /* ## Act ## */
    window.dispatchEvent(new Event("resize"));

    /* ## Assert ## */
    expect(applyOptionsMock).toHaveBeenCalled();
  });
});
