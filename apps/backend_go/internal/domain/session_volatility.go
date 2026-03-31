package domain

import (
	"time"
)

/*
 * SessionVolatility は各時間枠（セッション区分）の地合い（ボラティリティ）を表すコアエンティティです。
 * @responsibility: 1日の中の特定セッション（例：NY_Open）におけるボラティリティと、紐づく経済指標情報を保持する。
 */
type SessionVolatility struct {
	ID                 int        `json:"id"`
	Date               time.Time  `json:"date"`
	SessionName        string     `json:"sessionName"`
	StartTimeJST       string     `json:"startTimeJst"`     // DBから直接文字列(TIME型)として受ける
	EndTimeJST         string     `json:"endTimeJst"`       // DBから直接文字列(TIME型)として受ける
	VolatilityPoints   float64    `json:"volatilityPoints"` // その枠での最高値 - 最安値の幅
	HasEvent           bool       `json:"hasEvent"`
	HasHighImpactEvent bool       `json:"hasHighImpactEvent"`
	EventsLinked       string     `json:"eventsLinked"` // 紐づいた指標名のカンマ区切り
	Condition          string     `json:"condition"`    // 小(Small), 中(Mid), 大(Large)
}

/*
 * SessionThreshold はセッションごとの地合い（ボラティリティの大小）の判定基準を表します。
 * @responsibility: DBから取得したパーセンタイル閾値を保持する。
 */
type SessionThreshold struct {
	SessionName    string  `json:"sessionName"`
	SmallThreshold float64 `json:"smallThreshold"` // 小の閾値（33パーセンタイル以下）
	LargeThreshold float64 `json:"largeThreshold"` // 大の閾値（66パーセンタイル超）
}

