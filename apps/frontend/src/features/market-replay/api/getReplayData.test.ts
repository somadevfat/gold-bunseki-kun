import { expect, it, describe, mock, beforeEach } from "bun:test";
import { getReplayData } from "./getReplayData";

/* apiClient のモック化 */
const getMock = mock();
mock.module("../../../lib/api/client", () => ({
  apiClient: {
    api: {
      v1: {
        market: {
          replay: {
            $get: getMock,
          },
        },
      },
    },
  },
}));

describe("getReplayData", () => {
  beforeEach(() => {
    getMock.mockClear();
  });

  it("正常にデータを取得できた場合、JSON データを返すこと", async () => {
    /* ## Arrange ## */
    const mockResponse = { previousEvent: null, candles: [], historicalStats: [] };
    getMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    /* ## Act ## */
    const result = await getReplayData("TestEvent");

    /* ## Assert ## */
    expect(getMock).toHaveBeenCalled();
    // 引数のチェック（Hono RPC クライアントの形式）
    expect(getMock.mock.calls[0][0].query.event).toBe("TestEvent");
    expect(result).toEqual(mockResponse);
  });

  it("API 呼び出しがエラー（ok: false）の場合、null を返すこと", async () => {
    /* ## Arrange ## */
    getMock.mockResolvedValue({
      ok: false,
    });

  /* ## Act ## */
    const result = await getReplayData("BadEvent");

    /* ## Assert ## */
    expect(result).toBeNull();
  });
});
