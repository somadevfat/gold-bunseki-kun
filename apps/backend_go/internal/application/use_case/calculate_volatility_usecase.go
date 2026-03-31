package use_case

import (
	"context"
	"time"

	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * CalculateVolatilityUseCase は波の頂点と底から、ドル建ての値幅（ボラティリティ）を計算・保存するシナリオです。
 * @responsibility: 高値と安値からエンティティを作成し計算処理を実行。その後リポジトリに保存する。
 */
type CalculateVolatilityUseCase struct {
	volaRepo port.VolatilityRepository
}

func NewCalculateVolatilityUseCase(repo port.VolatilityRepository) *CalculateVolatilityUseCase {
	return &CalculateVolatilityUseCase{
		volaRepo: repo,
	}
}

/*
 * Execute は引数で渡された2つの価格（高値・安値）からボラティリティを計算し、DBに保存します。
 * @param: ctx
 * @param: targetDate 分析対象の日付
 * @param: high 高値
 * @param: low 安値
 * @return: エラー (error)
 */
func (uc *CalculateVolatilityUseCase) Execute(ctx context.Context, targetDate time.Time, high, low float64) error {
	// 1. 新しいボラティリティの「箱（エンティティ）」を手動で作る
	vola := &domain.Volatility{
		TargetDate: targetDate,
		HighPrice:  high,
		LowPrice:   low,
	}

	// 2. ドメインのルール「CalculateValue」を実行（値幅を計算させる）
	if err := vola.CalculateValue(); err != nil {
		// 高値が安値より下回っているなどのドメインエラーを検知
		return err
	}

	// 3. 無事に計算できたら、それをリポジトリ（ポート）経由で保存するようお願いする
	// ※ ctx（おまじない）もしっかり渡す
	if err := uc.volaRepo.Save(ctx, vola); err != nil {
		return err // 保存（DBアクセスなど）で失敗した場合
	}

	return nil // 何事もなく全工程が成功
}
