package controller

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

/*
 * HealthController はシステムの生存確認（ヘルスチェック）を担当するコントローラーです。
 * @responsibility: サーバーが正常に起動しているか、外部からの疎通を確認する。
 */
type HealthController struct{}

func NewHealthController() *HealthController {
	return &HealthController{}
}

/*
 * Check は「/health」へのリクエストに対し、正常であることを示すレスポンスを返します。
 * @param: ctx Echoのコンテキスト
 * @return: 200 OK + "status: ok"
 */
func (c *HealthController) Check(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, map[string]string{
		"status": "ok",
		"message": "Gold Volatility Bunseki API is running",
	})
}
