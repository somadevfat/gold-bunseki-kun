package domain

import (
	"time"
)

/*
 * EconomicIndicator は相場に影響を与える経済指標（イベント）を表す構造体です。
 * @responsibility: 経済指標の予測値や結果、およびそれによって発生したボラティリティへの参照を保持する。
 */
type EconomicIndicator struct {
	ID                 string
	Name               string
	ReleaseTime        time.Time
	Importance         string
	Forecast           float64
	Actual             float64
	CausedVolatilityID string
}

/*
 * IsReleased は経済指標がすでに発表済みかどうかを判定する関数です。
 * @responsibility: 指定した時刻と発表時刻を比較し、結果が出ているはずの状態かを確認する。
 * @return: 発表済みであればtrue、発表前（未来）であればfalse
 */
func (e *EconomicIndicator) IsReleased(currentTime time.Time) bool {
	// 発表時刻が引数の現在時刻よりも前、もしくは同じであれば発表済みとする
	return e.ReleaseTime.Before(currentTime) || e.ReleaseTime.Equal(currentTime)
}
