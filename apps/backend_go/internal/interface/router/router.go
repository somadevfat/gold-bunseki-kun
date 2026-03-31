package router

import (
	"gold-vola-bunseki/backend/internal/interface/controller"
	"github.com/labstack/echo/v4"
)

/*
 * InitRoutes はWeb上のURL（/api/...）とコントローラーを紐付けるルーター設定機能です。
 * @responsibility: エンドポイント一覧を定義し、それぞれどのコントローラーのメソッドを呼ぶかを決める。
 */
func InitRoutes(e *echo.Echo, priceCtrl *controller.PriceController, healthCtrl *controller.HealthController, zigzagCtrl *controller.ZigZagController, sessionCtrl *controller.SessionController, replayCtrl *controller.ReplayController, syncCtrl *controller.SyncController) {
	// 公開エンドポイント（ヘルスチェックなど）
	e.GET("/health", healthCtrl.Check)

	// APIエンドポイントグループ（/api/v1 ...）
	v1 := e.Group("/api/v1")
	v1.GET("/prices/latest", priceCtrl.GetLatest)
	v1.GET("/zigzag/calculate", zigzagCtrl.Calculate)
	v1.GET("/market/sessions", sessionCtrl.GetRecentSessions) // DBから最新地合いを取得するエンドポイント
	v1.GET("/market/replay", replayCtrl.GetEventReplay)      // 前回指標再現用エンドポイント
	v1.GET("/sync/status", syncCtrl.GetStatus)               // 同期状況を確認するエンドポイント
}
