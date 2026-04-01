import { expect, it, describe, mock, beforeEach } from "bun:test";
import { getSessions } from "./getSessions";

/* apiClient のモック化 */
const getMock = mock();
mock.module("../../../lib/api/client", () => ({
  apiClient: {
    api: {
      v1: {
        market: {
          sessions: {
            $get: getMock,
          },
        },
      },
    },
  },
}));

describe("getSessions", () => {
  beforeEach(() => {
    getMock.mockClear();
  });

  it("正常にデータを取得できた場合、JSON データを返すこと", async () => {
    /* ## Arrange ## */
    const mockResponse = { sessions: [], currentCondition: "Large" };
    getMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    /* ## Act ## */
    const result = await getSessions(5);

    /* ## Assert ## */
    expect(getMock).toHaveBeenCalled();
    expect(getMock.mock.calls[0][0].query.limit).toBe("5");
    expect(result).toEqual(mockResponse);
  });

  it("API 呼び出しが失敗した場合、空のデフォルト値を返すこと", async () => {
    /* ## Arrange ## */
    getMock.mockResolvedValue({
      ok: false,
    });

    /* ## Act ## */
    const result = await getSessions();

    /* ## Assert ## */
    expect(result).toEqual({ currentCondition: "Unknown", sessions: [] });
  });
});
