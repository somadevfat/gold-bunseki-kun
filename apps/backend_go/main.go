package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"gold-vola-bunseki/backend/internal/application/use_case"
	"gold-vola-bunseki/backend/internal/infrastructure/repository"
	"gold-vola-bunseki/backend/internal/infrastructure/service"
	"gold-vola-bunseki/backend/internal/interface/controller"
	"gold-vola-bunseki/backend/internal/interface/router"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware" // 追加
	_ "github.com/lib/pq"
)

func main() {
	// ==============================================================================
	// 0. 環境変数とデータベースのセットアップ
	// ==============================================================================
	_ = godotenv.Load() // .envファイルがあれば読み込む
	
	// DockerネットワークまたはローカルからのDB接続情報 (本来は.envから読み込む)
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbDSN := fmt.Sprintf("host=%s port=5432 user=user password=password dbname=gold_vola_db sslmode=disable", dbHost)
	
	db, err := sql.Open("postgres", dbDSN)
	if err != nil {
		log.Fatalf("❌ データベース接続初期化エラー: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("❌ PostgreSQLへの接続(Ping)に失敗しました: %v", err)
	}
	log.Println("✅ PostgreSQL Database 接続成功!")

	// ==============================================================================
	// 各レイヤーの初期化と依存関係の注入（DI）
	// ==============================================================================

	// 1. Infrastructure 層のセットアップ (依存関係の末端)
	priceRepo := repository.NewPriceRepository()
	zigzagRepo := repository.NewZigZagRepositoryImpl()
	sessionRepo := repository.NewSessionRepositoryImpl(db) // 追加: 地合い(セッション)用レポジトリ
	
	// Pythonサーバー(8000ポート)へのクライアント
	analyticsClient := service.NewAnalyticsClient("http://localhost:8000")

	// 2. Application 層のセットアップ
	// リポジトリや外部通信クライアントを注入 (DI)
	fetchPriceUC := use_case.NewFetchPriceUseCase(priceRepo)
	calcZigZagUC := use_case.NewCalculateZigZagUseCase(priceRepo, analyticsClient, zigzagRepo)
	fetchSessionsUC := use_case.NewFetchSessionsUseCase(sessionRepo) 
	getReplayDC := use_case.NewGetReplayDataUseCase(sessionRepo) // 追加: 再現データ取得用UC
	getSyncStatusUC := use_case.NewGetSyncStatusUseCase(sessionRepo) // 追加: 同期状況取得用UC

	// 3. Interface 層のセットアップ
	// ユースケースを注入 (DI)
	priceCtrl := controller.NewPriceController(fetchPriceUC)
	healthCtrl := controller.NewHealthController()
	zigzagCtrl := controller.NewZigZagController(calcZigZagUC)
	sessionCtrl := controller.NewSessionController(fetchSessionsUC) 
	replayCtrl := controller.NewReplayController(getReplayDC) // 追加: 再現データ用Ctrl
	syncCtrl := controller.NewSyncController(getSyncStatusUC) // 追加: 同期状況用Ctrl

	/*
	 * 【Webサーバー起動フェーズ】
	 */

	// 4. Echo（Webフレームワーク）の準備
	e := echo.New()

	// CORS設定: ブラウザからのアクセスを許可
	e.Use(middleware.CORS())

	// 5. ルーティングの登録
	router.InitRoutes(e, priceCtrl, healthCtrl, zigzagCtrl, sessionCtrl, replayCtrl, syncCtrl)

	// 6. サーバー起動（ポート8080）
	log.Println("⚡️ Starting Gold Volatility Bunseki API on port 8080...")
	e.Logger.Fatal(e.Start(":8080"))
}
