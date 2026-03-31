package port

import (
	"context"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * SessionRepository は地合い（ボラティリティ）データの永続化・取得を担うインターフェースです。
 * @responsibility: DB等からSessionVolatilityのデータを取得する契約（Contract）を定義する。
 */
type SessionRepository interface {
	// FindRecent を使って直近数日分の地合いデータを取得します
	FindRecent(ctx context.Context, limit int) ([]*domain.SessionVolatility, error)
	// GetThresholds はセッションごとの地合い閾値を取得します
	GetThresholds(ctx context.Context) (map[string]*domain.SessionThreshold, error)
	// FindPreviousEvent は指定した指標の「前回発表時」の情報を取得します
	FindPreviousEvent(ctx context.Context, eventName string) (*domain.SessionVolatility, error)
	// GetCandles は特定日・特定セッションの1分足を取得します
	GetCandles(ctx context.Context, date string, sessionName string) ([]*domain.Candle, error)
	// GetEventStats は指標 × 地合い(大中小) 別の過去平均ボラティリティを算出します
	GetEventStats(ctx context.Context, eventName string, thresholds map[string]*domain.SessionThreshold) ([]*domain.HistoricalAverage, error)
	// GetSyncStatus は現在のデータの同期状況（最新日時など）を取得します
	GetSyncStatus(ctx context.Context) (*domain.SyncStatus, error)
}
