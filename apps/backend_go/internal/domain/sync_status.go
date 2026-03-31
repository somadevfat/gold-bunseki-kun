package domain

import "time"

/*
 * SyncStatus はデータベースの全データの最新状況を表します。
 * @responsibility: 1分足、セッション、経済指標それぞれの最新更新日時をひとまとめにし、
 * MT5からの同期がどこまで完了しているかを管理する。
 */
type SyncStatus struct {
	LastCandleAt  time.Time `json:"lastCandleAt"`  // 最終足の日時
	LastSessionAt time.Time `json:"lastSessionAt"` // 最終セッション集計の日時
	LastEventAt   time.Time `json:"lastEventAt"`   // 最新の経済指標（実績）の日時
	TotalCandles  int64     `json:"totalCandles"`  // 1分足の累計件数
	SyncHealth    string    `json:"syncHealth"`    // "Healthy" | "Stale" (24h以上更新がない場合)
}
