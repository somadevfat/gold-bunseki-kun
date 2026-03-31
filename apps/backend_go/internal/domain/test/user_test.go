package test

import (
	"testing"
	"time"
	"gold-vola-bunseki/backend/internal/domain"
)

func TestUser_IsPremiumActive(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name    string
		user    domain.User
		nowTime time.Time
		want    bool
	}{
		{
			name: "正常: 期限が1分後なので有効",
			user: domain.User{
				SubscriptionValidUntil: now.Add(1 * time.Minute),
			},
			nowTime: now,
			want:    true,
		},
		{
			name: "境界値: 期限ぴったり（同時刻は無効とする仕様想定）",
			user: domain.User{
				SubscriptionValidUntil: now,
			},
			nowTime: now,
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.user.IsPremiumActive(tt.nowTime); got != tt.want {
				t.Errorf("IsPremiumActive() = %v, want %v", got, tt.want)
			}
		})
	}
}
