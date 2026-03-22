package main

import (
	"log"

	"github.com/labstack/echo/v4"
	
	"gold-vola-bunseki/api/internal/application/use_case"
	"gold-vola-bunseki/api/internal/infrastructure/repository"
	"gold-vola-bunseki/api/internal/interface/controller"
	"gold-vola-bunseki/api/internal/interface/router"
)

func main() {
	// 各レイヤーの初期化と依存関係の注入（DI）

	// 1. インフラ層の初期化
	priceRepo := repository.NewPriceRepository()

	// 2. アプリケーション層の初期化
	fetchPriceUC := use_case.NewFetchPriceUseCase(priceRepo)

	// 3. インターフェース層の初期化
	priceCtrl := controller.NewPriceController(fetchPriceUC)
	healthCtrl := controller.NewHealthController()


	/*
	 * 【Webサーバー起動フェーズ】
	 */

	// 4. Echo（Webフレームワーク）の準備
	e := echo.New()

	// 5. ルーティング（URL）の登録
	router.InitRoutes(e, priceCtrl, healthCtrl)

	// 6. サーバー起動（ポート8080）
	log.Println("⚡️ Starting Gold Volatility Bunseki API on port 8080...")
	e.Logger.Fatal(e.Start(":8080"))
}
