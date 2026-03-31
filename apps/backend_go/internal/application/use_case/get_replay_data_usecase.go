package use_case

import (
	"context"
	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * ReplayDataResponse は前回指標時のチャート再現用データと、地合い別の統計データをまとめたレスポンスです。
 */
type ReplayDataResponse struct {
	PreviousEvent    *domain.SessionVolatility   `json:"previousEvent"`
	Candles          []*domain.Candle            `json:"candles"`
	HistoricalStats  []*domain.HistoricalAverage `json:"historicalStats"`
}

/*
 * GetReplayDataUseCase は「前回指標時の事実」を呼び出すユースケース。
 * @responsibility: 特定の指標名を受け取り、その前回のチャートと全履歴の地合い別平均ボラを返す。
 */
type GetReplayDataUseCase struct {
	sessionRepo port.SessionRepository
}

func NewGetReplayDataUseCase(r port.SessionRepository) *GetReplayDataUseCase {
	return &GetReplayDataUseCase{sessionRepo: r}
}

/*
 * Execute は指定された指標名に基づいて、再現データと統計データを一括取得します。
 */
func (uc *GetReplayDataUseCase) Execute(ctx context.Context, eventName string) (*ReplayDataResponse, error) {
	// 1. 指定指標の「前回発表時」のセッション情報を取得
	prev, err := uc.sessionRepo.FindPreviousEvent(ctx, eventName)
	if err != nil {
		return nil, err
	}

	var candles []*domain.Candle
	if prev != nil {
		// 2. そのセッションの1分足を取得
		candles, err = uc.sessionRepo.GetCandles(ctx, prev.Date.Format("2006-01-02"), prev.SessionName)
		if err != nil {
			return nil, err
		}
	}

	// 3. 統計計算のため、最新の閾値（地合い境界）を取得
	thresholds, err := uc.sessionRepo.GetThresholds(ctx)
	if err != nil {
		return nil, err
	}

	// 4. 指標 × 地合い(大中小) 別の過去統計を取得
	stats, err := uc.sessionRepo.GetEventStats(ctx, eventName, thresholds)
	if err != nil {
		return nil, err
	}

	return &ReplayDataResponse{
		PreviousEvent:   prev,
		Candles:         candles,
		HistoricalStats: stats,
	}, nil
}
