package domain

import (
	"time"
)

// UserRole はユーザーの権限（管理者か、プレミアムか）を表すカスタム型です
type UserRole string

const (
	RoleAdmin       UserRole = "Admin"
	RolePremiumUser UserRole = "PremiumUser"
)

/*
 * User はAI予測の閲覧が可能な有料サブスクリプション会員を表す構造体です。
 * @responsibility: プレミアムユーザーの認証情報とサブスクリプションの有効期限を管理する。
 */
type User struct {
	ID                     string
	Name                   string
	Email                  string
	Password               string // ハッシュ化済み
	Role                   UserRole
	SubscriptionValidUntil time.Time
}

/*
 * IsPremiumActive はサブスクリプションが現在も有効かどうかを判定する関数です。
 * @responsibility: ユーザーの有効期限が現在時刻を過ぎていないか検証し、機能制限の可否を決定する。
 * @return: サブスクリプションが有効であればtrue、失効していればfalse
 */
func (u *User) IsPremiumActive(currentTime time.Time) bool {
	// 管理者の場合は無条件で全機能にアクセス可能とする（運用上の柔軟性）
	if u.Role == RoleAdmin {
		return true
	}

	// サブスクリプションの有効期限が現在時刻より未来であれば、有効とみなす
	return u.SubscriptionValidUntil.After(currentTime)
}
