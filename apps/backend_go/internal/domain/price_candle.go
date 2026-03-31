package domain

import "time"

/*
 * Candle は過去のチャート再現用に使用する1分足データです。
 * @responsibility: 1分ごとの価格（OHLC）を保持し、フロントエンドでのチャート描画に使用される。
 */
type Candle struct {
	DatetimeJST time.Time `json:"datetimeJst"`
	Open        float64   `json:"open"`
	High        float64   `json:"high"`
	Low         float64   `json:"low"`
	Close       float64   `json:"close"`
}

/*
 * HistoricalAverage は「指標 × 地合い」別の過去の平均ボラティリティ結果を表します。
 * @responsibility: 特定の指標が大地合いの時、平均何ポイント動いたかといった数値を保持する。
 */
type HistoricalAverage struct {
	EventName       string  `json:"eventName"`
	Condition       string  `json:"condition"`      // Large, Mid, Small
	AverageVola     float64 `json:"averageVola"`    // 過去の平均値
	Count           int     `json:"count"`          // 集計対象となった標本数
}
