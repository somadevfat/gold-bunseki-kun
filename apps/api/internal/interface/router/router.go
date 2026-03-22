package router

import (
	"gold-vola-bunseki/api/internal/interface/controller"
	"github.com/labstack/echo/v4"
)

/*
 * InitRoutes はWeb上のURL（/api/...）とコントローラーを紐付けるルーター設定機能です。
 * @responsibility: エンドポイント一覧を定義し、それぞれどのコントローラーのメソッドを呼ぶかを決める。
 */
func InitRoutes(e *echo.Echo, priceCtrl *controller.PriceController, healthCtrl *controller.HealthController) {
	// 公開エンドポイント（ヘルスチェックなど）
	e.GET("/health", healthCtrl.Check)

	// APIエンドポイントグループ（/api/v1 ...）
	v1 := e.Group("/api/v1")
	v1.GET("/prices/latest", priceCtrl.GetLatest)
}
