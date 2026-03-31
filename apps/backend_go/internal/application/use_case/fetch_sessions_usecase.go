package use_case

import (
	"context"
	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * FetchSessionsResponse はセッション一覧と現在の地合い状態を返すレスポンスです。
 */
type FetchSessionsResponse struct {
	CurrentCondition string                      `json:"currentCondition"` // 直近3セッションの最大地合い
	Sessions         []*domain.SessionVolatility `json:"sessions"`
}

/*
 * FetchSessionsUseCase はDBから最新の地合いデータを取得するユースケース。
 * @responsibility: コントローラーから呼ばれ、リポジトリを通じて地合い（ボラティリティ結果）を取得する。
 */
type FetchSessionsUseCase struct {
	sessionRepo port.SessionRepository
}

func NewFetchSessionsUseCase(r port.SessionRepository) *FetchSessionsUseCase {
	return &FetchSessionsUseCase{sessionRepo: r}
}

/*
 * Execute は直近の一連のセッション（時間枠ごとのボラ）結果を呼び出します。
 * @return: 現在の地合い状態と指定件数の地合いデータリストを含むレスポンス
 */
func (uc *FetchSessionsUseCase) Execute(ctx context.Context, limit int) (*FetchSessionsResponse, error) {
	sessions, err := uc.sessionRepo.FindRecent(ctx, limit)
	if err != nil {
		return nil, err
	}

	thresholds, err := uc.sessionRepo.GetThresholds(ctx)
	if err != nil {
		return nil, err
	}

	// 条件の強さを定義（大中小の比較用）
	conditionStrength := map[string]int{
		"Small": 1,
		"Mid":   2,
		"Large": 3,
	}

	maxConditionStrength := 1
	currentCondition := "Small"

	// 各セッションの地合いを判定
	for i, s := range sessions {
		cond := "Unknown"
		if t, ok := thresholds[s.SessionName]; ok {
			if s.VolatilityPoints <= t.SmallThreshold {
				cond = "Small"
			} else if s.VolatilityPoints <= t.LargeThreshold {
				cond = "Mid"
			} else {
				cond = "Large"
			}
		}
		s.Condition = cond

		// 直近3セッションの最大地合いを計算（i=0, 1, 2）
		if i < 3 && cond != "Unknown" {
			strength := conditionStrength[cond]
			if strength > maxConditionStrength {
				maxConditionStrength = strength
				currentCondition = cond
			}
		}
	}

	return &FetchSessionsResponse{
		CurrentCondition: currentCondition,
		Sessions:         sessions,
	}, nil
}

