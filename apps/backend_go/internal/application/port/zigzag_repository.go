package port

import (
	"context"
	"time"

	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * ZigZagRepository はZigZagポイント（スイングハイ・ロー）のバッファ・永続化に関するポートです。
 * @responsibility: アプリ内（またはPython側）で計算した波の頂点・底のデータを保持・取得する。
 */
type ZigZagRepository interface {
	/*
	 * SavePoints は算出されたZigZagポイントの配列を一括で保存（更新）します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: points 保存対象のスイングハイ・ローのリスト
	 * @return: エラー (error)
	 */
	SavePoints(ctx context.Context, points []*domain.ZigZagPoint) error

	/*
	 * FindByTimeWindow は特定の時間枠内に発生したZigZagポイントを取得します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: start 開始時間
	 * @param: end 終了時間
	 * @return: ZigZagポイントのスライス ([]*domain.ZigZagPoint), エラー (error)
	 */
	FindByTimeWindow(ctx context.Context, start time.Time, end time.Time) ([]*domain.ZigZagPoint, error)
}
