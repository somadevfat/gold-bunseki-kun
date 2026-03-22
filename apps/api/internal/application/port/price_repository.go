package port

import (
	"context"

	"gold-vola-bunseki/api/internal/domain"
)

/*
 * PriceRepository は価格データの永続化と取得に関するポートです。
 * @responsibility: 外部データソースから価格データ(1分足等)を取得する窓口。
 */
type PriceRepository interface {
	/*
	 * FetchLatest は最新のゴールド価格を取得します。
	 * @param: ctx リクエストのコンテキスト
	 * @return: 価格レコード (*domain.PriceRecord), エラー (error)
	 */
	FetchLatest(ctx context.Context) (*domain.PriceRecord, error)
}