import { expect, it, describe, mock, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useIndicatorSelection } from "./useIndicatorSelection";

/* next/navigation のモック化 */
const pushMock = mock();
const getMock = mock();

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: getMock,
    toString: () => "event=InitialEvent",
  }),
}));

describe("useIndicatorSelection", () => {
  beforeEach(() => {
    pushMock.mockClear();
    getMock.mockClear();
  });

  it("現在のイベント名を URL パラメータから取得できること", () => {
    /* ## Arrange ## */
    getMock.mockReturnValue("CPI");

    /* ## Act ## */
    const { result } = renderHook(() => useIndicatorSelection());

    /* ## Assert ## */
    expect(result.current.currentEvent).toBe("CPI");
    expect(getMock).toHaveBeenCalledWith("event");
  });

  it("URL パラメータが存在しない場合、デフォルト値を返すこと", () => {
    /* ## Arrange ## */
    getMock.mockReturnValue(null);

    /* ## Act ## */
    const { result } = renderHook(() => useIndicatorSelection("DefaultVal"));

    /* ## Assert ## */
    expect(result.current.currentEvent).toBe("DefaultVal");
  });

  it("selectIndicator を呼び出した際、正しく URL パラメータを更新して push すること", () => {
    /* ## Arrange ## */
    getMock.mockReturnValue("OldEvent");

    /* ## Act ## */
    const { result } = renderHook(() => useIndicatorSelection());
    act(() => {
      result.current.selectIndicator("NewEvent");
    });

    /* ## Assert ## */
    // URLSearchParams の toString() は mock.module の中ではスタブ化されているが、
    // 実装側で new URLSearchParams(...) されるため、最終的な push 引数を検証。
    expect(pushMock).toHaveBeenCalledWith("?event=NewEvent", { scroll: false });
  });
});
