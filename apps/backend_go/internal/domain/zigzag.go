package domain

import (
	"time"
)

// ZigZagType はスイングが「高値（High）」か「安値（Low）」かを表すカスタムの文字列型です。
type ZigZagType string

const (
	ZigZagTypeHigh ZigZagType = "High"
	ZigZagTypeLow  ZigZagType = "Low"
)

/*
 * ZigZagPoint は価格のノイズを排除し、意味のあるスイングの頂点と底を表す構造体です。
 * @responsibility: 時間と価格、それがスイングハイかスイングローかを紐付けて保持する。
 */
type ZigZagPoint struct {
	Timestamp time.Time
	Price     float64
	Type      ZigZagType
}

/*
 * IsHigh はこの転換点がスイングハイ（高値）であるかを判定する関数です。
 * @responsibility: ZigZagのタイプが「高値」であるかを確認し、上値計算のロジックに利用しやすくする。
 * @return: スイングハイであればtrue、そうでなければfalse
 */
func (z *ZigZagPoint) IsHigh() bool {
	// 自身のTypeが定数のHighと一致するかをチェックする
	return z.Type == ZigZagTypeHigh
}
