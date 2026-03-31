package controller

import (
	"net/http"

	"gold-vola-bunseki/backend/internal/application/use_case"
	"github.com/labstack/echo/v4"
)

/*
 * PriceController はゴールド価格に関するHTTPリクエストを処理するコントローラーです。
 * @responsibility: HTTPリクエストを受け取り、ユースケースを実行し、結果をJSONで出力する。
 */
type PriceController struct {
	fetchPriceUseCase *use_case.FetchPriceUseCase
}

/*
 * NewPriceController はコントローラーの生成(DI)を行います。
 */
func NewPriceController(useCase *use_case.FetchPriceUseCase) *PriceController {
	return &PriceController{
		fetchPriceUseCase: useCase,
	}
}

/*
 * GetLatest は「最新の価格ちょうだい」というリクエスト（GET /api/v1/prices/latest）を処理します。
 * @responsibility: 外部からのHTTP GETリクエストからコンテキストを抽出し、ユースケースに投げてJSON化する。
 */
func (c *PriceController) GetLatest(ctx echo.Context) error {
	// Echoの「ctx」から、Go標準の文脈（context.Context）を取り出してユースケースに渡す
	reqCtx := ctx.Request().Context()

	// ユースケース「価格を取得して検証して」を実行
	price, err := c.fetchPriceUseCase.Execute(reqCtx)
	if err != nil {
		// エラーがあれば 500 (Internal Server Error) をJSONで返す
		return ctx.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	// 大成功なら 200 (OK) と取得した価格データをJSONにして返す
	return ctx.JSON(http.StatusOK, price)
}
