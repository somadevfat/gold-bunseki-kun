package port

import (
	"context"

	"gold-vola-bunseki/api/internal/domain"
)

/*
 * UserRepository はユーザー情報の永続化と取得に関するポートです。
 * @responsibility: データベース等からプレミアムユーザーなどの情報を取得し、認証・認可の基礎データを提供する。
 */
type UserRepository interface {
	/*
	 * FindByID は指定されたユーザーIDに該当するユーザー情報を取得します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: id 検索したいユーザーのID
	 * @return: ユーザーレコード (*domain.User), エラー (error)
	 */
	FindByID(ctx context.Context, id string) (*domain.User, error)

	/*
	 * Save はユーザー情報を新規作成または更新します。
	 * @param: ctx リクエストのコンテキスト
	 * @param: user 保存したいユーザーモデル
	 * @return: エラー (error)
	 */
	Save(ctx context.Context, user *domain.User) error
}
