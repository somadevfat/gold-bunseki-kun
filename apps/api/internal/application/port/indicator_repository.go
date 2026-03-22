package port

import (
	"context"
	"time"

	"gold-vola-bunseki/api/internal/domain"
)

/*
 * IndicatorRepository は経済指標データの永続化と取得に関するポートです。
 * @responsibility: 外部の指標カレンダー(API)やDBから経済指標（雇用統計など）の推移や結果を取得する。
 */
type IndicatorRepository interface {
	/*
	 * FindByDateRange は指定した期間に発表される（された）経済指標のリストを取得します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: start 期間の開始日時
	 * @param: end 期間の終了日時
	 * @return: 経済指標のスライス ([]*domain.EconomicIndicator), エラー (error)
	 */
	FindByDateRange(ctx context.Context, start time.Time, end time.Time) ([]*domain.EconomicIndicator, error)
}
