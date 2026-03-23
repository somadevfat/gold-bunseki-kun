package main

import (
	"log"

	"gold-vola-bunseki/api/internal/application/use_case"
	"gold-vola-bunseki/api/internal/infrastructure/repository"
	"gold-vola-bunseki/api/internal/infrastructure/service"
	"gold-vola-bunseki/api/internal/interface/controller"
	"gold-vola-bunseki/api/internal/interface/router"

	"github.com/labstack/echo/v4"
)

func main() {
	// 各レイヤーの初期化と依存関係の注入（DI）

	// 1. Infrastructure 層のセットアップ (依存関係の末端)
	priceRepo := repository.NewPriceRepository()
	zigzagRepo := repository.NewZigZagRepositoryImpl()
	// Pythonサーバー(8000ポート)へのクライアント
	analyticsClient := service.NewAnalyticsClient("http://localhost:8000")

	// 2. Application 層のセットアップ
	// リポジトリや外部通信クライアントを注入 (DI)
	fetchPriceUC := use_case.NewFetchPriceUseCase(priceRepo)
	calcZigZagUC := use_case.NewCalculateZigZagUseCase(priceRepo, analyticsClient, zigzagRepo)

	// 3. Interface 層のセットアップ
	// ユースケースを注入 (DI)
	priceCtrl := controller.NewPriceController(fetchPriceUC)
	healthCtrl := controller.NewHealthController()
	zigzagCtrl := controller.NewZigZagController(calcZigZagUC)

	/*
	 * 【Webサーバー起動フェーズ】
	 */

	// 4. Echo（Webフレームワーク）の準備
	e := echo.New()

	// 5. ルーティングの登録
	router.InitRoutes(e, priceCtrl, healthCtrl, zigzagCtrl)

	// 6. サーバー起動（ポート8080）
	log.Println("⚡️ Starting Gold Volatility Bunseki API on port 8080...")
	e.Logger.Fatal(e.Start(":8080"))
}
