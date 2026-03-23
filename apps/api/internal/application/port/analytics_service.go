package port

import (
	"context"
	"gold-vola-bunseki/api/internal/domain"
)

/*
 * AnalyticsService はデータ分析機能（Python側）へ通信するためのポートです。
 * @responsibility: 外部の分析基盤を利用して高度な計算を行う。
 */
type AnalyticsService interface {
	CalculateZigZag(ctx context.Context, prices []*domain.PriceRecord) ([]*domain.ZigZagPoint, error)
}
