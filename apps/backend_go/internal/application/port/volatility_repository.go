package port

import (
	"context"
	"time"

	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * VolatilityRepository はボラティリティの計算結果の永続化と取得に関するポートです。
 * @responsibility: アプリケーションが算出したボラティリティ（値幅）結果をDBに保存したり、過去の分析結果を取得したりする。
 */
type VolatilityRepository interface {
	/*
	 * Save は計算されたボラティリティの結果を保存します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: vol 保存したいボラティリティのエンティティ
	 * @return: エラー (error)
	 */
	Save(ctx context.Context, vol *domain.Volatility) error

	/*
	 * FindByTargetDate は特定の日付（ターゲット日）に関するボラティリティ一覧を取得します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: date 検索対象の日付
	 * @return: ボラティリティのスライス ([]*domain.Volatility), エラー (error)
	 */
	FindByTargetDate(ctx context.Context, date time.Time) ([]*domain.Volatility, error)
}
