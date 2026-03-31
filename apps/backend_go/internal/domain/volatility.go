package domain

import (
	"errors"
	"time"
)

/*
 * Volatility は特定の時間枠内で発生した「値幅」を表す構造体です。
 * @responsibility: ZigZagの高値・安値からのボラティリティ値（ドル幅）を保持・算出する。
 */
type Volatility struct {
	ID                 string
	TimeWindow         string
	TargetDate         time.Time
	HighPrice          float64
	LowPrice           float64
	Value              float64
	Deviation          string
	RelatedIndicatorID string
}

/*
 * CalculateValue は高値と安値から真のボラティリティ値（ドル幅）を算出する関数です。
 * @responsibility: 高値と安値の差分を計算し、Valueプロパティに設定する。
 * @return: 計算エラー（高値が安値を下回る異常値の場合error）
 */
func (v *Volatility) CalculateValue() error {
	// 高値が安値を下回っている場合は異常値としてエラーを返す
	if v.HighPrice < v.LowPrice {
		return errors.New("high price cannot be lower than low price")
	}

	// 高値から安値を引いて真のボラティリティ（値幅）を算出
	v.Value = v.HighPrice - v.LowPrice
	return nil
}