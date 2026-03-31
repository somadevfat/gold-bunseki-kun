package use_case

import (
	"context"
	"fmt"
	"time"

	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * CalculateZigZagUseCase は価格履歴からZigZag波の転換点をPythonに計算させ、DBに保存するユースケースです。
 */
type CalculateZigZagUseCase struct {
	priceRepo        port.PriceRepository
	analyticsService port.AnalyticsService
	zigzagRepo       port.ZigZagRepository
}

func NewCalculateZigZagUseCase(pr port.PriceRepository, as port.AnalyticsService, zr port.ZigZagRepository) *CalculateZigZagUseCase {
	return &CalculateZigZagUseCase{
		priceRepo:        pr,
		analyticsService: as,
		zigzagRepo:       zr,
	}
}

func (uc *CalculateZigZagUseCase) Execute(ctx context.Context) ([]*domain.ZigZagPoint, error) {
	// 1. 最新価格を取ってくる（本来はDBから過去100件等を取りますが、今回は確認のため一時的にダミー配列を水増しします）
	latest, err := uc.priceRepo.FetchLatest(ctx)
	if err != nil {
		return nil, err
	}
	
	// （通信確認用ダミー履歴）
	prices := []*domain.PriceRecord{
		{Timestamp: latest.Timestamp.Add(-3 * 24 * time.Hour), Open: 2280, High: 2290, Low: 2270, Close: 2285},
		{Timestamp: latest.Timestamp.Add(-2 * 24 * time.Hour), Open: 2285, High: 2350, Low: 2280, Close: 2310}, // 高値！
		{Timestamp: latest.Timestamp.Add(-1 * 24 * time.Hour), Open: 2310, High: 2315, Low: 2200, Close: 2265}, // 安値！
		latest,
	}

	// 2. Python分析サーバー（AI）へ投げて「波の頂点」をリストで返してもらう
	points, err := uc.analyticsService.CalculateZigZag(ctx, prices)
	if err != nil {
		return nil, fmt.Errorf("Pythonでの処理に失敗しました: %w", err)
	}

	// 3. 結果が返ってくれば、DBに保存する
	if len(points) > 0 {
		if err := uc.zigzagRepo.SavePoints(ctx, points); err != nil {
			return nil, fmt.Errorf("DBへの保存に失敗: %w", err)
		}
	}

	// フロントエンド（Controller部）へ結果を渡す
	return points, nil
}
