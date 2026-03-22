package domain

import (
	"errors"
	"time"
)

/*
 * PriceRecord は1分足のゴールド価格データを表す構造体です。
 * @responsibility: 市場から取得した生の1分足価格データを保持する。
 */
type PriceRecord struct {
	Timestamp time.Time
	Open      float64
	High      float64
	Low       float64
	Close     float64
}

/*
 * Validate は価格データのドメインルール（ビジネス上の整合性）をチェックする関数です。
 * @responsibility: 高値と安値の関係性や価格の正数性を検証し、データの信頼性を保証する。
 * @return: 整合性エラー（error）
 */
func (p *PriceRecord) Validate() error {
	// 高値が安値を下回っていないか比較
	if p.High < p.Low {
		return errors.New("high price cannot be lower than low price")
	}

	// 各価格が正の数値（0より大きい）であるかを確認
	if p.Open <= 0 || p.High <= 0 || p.Low <= 0 || p.Close <= 0 {
		return errors.New("price values must be greater than zero")
	}
	return nil
}

