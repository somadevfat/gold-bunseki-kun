package use_case

import (
	"context"
	"errors"
	"time"

	"gold-vola-bunseki/api/internal/application/port"
	"gold-vola-bunseki/api/internal/domain"
)

/*
 * VerifyPremiumUserUseCase は特定のユーザーが有料機能を実行できる権限があるか検証するシナリオです。
 * @responsibility: UserRepositoryからユーザーを引き、プレミアム期間の検証ロジックを呼び出す。
 */
type VerifyPremiumUserUseCase struct {
	userRepo port.UserRepository
}

// 権限エラーの定義（ドメインではなくアプリ固有の概念としてここに置くことも多いです）
var ErrSubscriptionExpired = errors.New("subscription has expired")

/*
 * NewVerifyPremiumUserUseCase はユースケースの生成関数です。
 * @param: repo ユーザー情報の出入り口となるポート
 * @return: ユースケース本体
 */
func NewVerifyPremiumUserUseCase(repo port.UserRepository) *VerifyPremiumUserUseCase {
	return &VerifyPremiumUserUseCase{
		userRepo: repo,
	}
}

/*
 * Execute はユーザー権限の検証フローを実行します。
 * @param: ctx
 * @param: userID 検証したいユーザーのID
 * @return: 検証済みのユーザー情報, エラー
 */
func (uc *VerifyPremiumUserUseCase) Execute(ctx context.Context, userID string) (*domain.User, error) {
	// 1. リポジトリに「IDで探してきて」とお願いする
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err // ユーザーが見つからなかった、またはDB通信エラー
	}

	// 2. ドメインのルール「IsPremiumActive」を使って、現在時刻で判定する
	if !user.IsPremiumActive(time.Now()) {
		// 期限切れの場合は自作の「期限切れエラー」を返す
		return nil, ErrSubscriptionExpired
	}

	// 3. 全てクリアしたら、権限ありとしてユーザー情報を返す
	return user, nil
}
