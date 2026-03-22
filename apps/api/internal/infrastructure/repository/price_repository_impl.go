package repository

import (
	"context"
	"log"
	"time"

	"gold-vola-bunseki/api/internal/application/port"
	"gold-vola-bunseki/api/internal/domain"
)

/*
 * priceRepositoryImpl はPortで定義されたルールを満たす「ガチのインフラ実装」です。
 * @responsibility: 外部API（Twelve Data等）やDBに接続して価格データを取得する。
 */
type priceRepositoryImpl struct {
	// ここに将来、DBコネクション（sql.DBやORM）等の変数を持ちます
	// db *sql.DB
}

/*
 * NewPriceRepository は本番用（インフラ層）の価格リポジトリを生成します。
 * 戻り値の型を「port.PriceRepository」というインターフェースにすることで、
 * ユースケース側には「中身が何で動いているか」を隠すことができます（依存性の逆転）。
 */
func NewPriceRepository() port.PriceRepository {
	return &priceRepositoryImpl{}
}

/*
 * FetchLatest はインターフェースの約束通りにメソッドを「実装(implements)」した部分です。
 * @responsibility: 今回はDBやAPIが繋がっていないため、ダミーの本日のゴールド価格(XAU/USD)を返す。
 */
func (r *priceRepositoryImpl) FetchLatest(ctx context.Context) (*domain.PriceRecord, error) {
	log.Println("🔌 インフラ層: 外部API（またはデータベース）へ FetchLatest を実行中...")

	// 将来はここに "SELECT * FROM prices ORDER BY timestamp DESC LIMIT 1" などの処理を書きます。
	
	// 今はテスト動作用に「本物っぽい」ダミーデータを作って返します
	dummyLatestPrice := &domain.PriceRecord{
		Timestamp: time.Now(),
		Open:      2300.50,
		High:      2315.00,
		Low:       2295.00,
		Close:     2310.25,
	}

	return dummyLatestPrice, nil
}
