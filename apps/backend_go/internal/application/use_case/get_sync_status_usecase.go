package use_case

import (
	"context"
	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * GetSyncStatusUseCase はデータ同期の状況を取得するユースケースです。
 * @responsibility: リポジトリからDBの最新状態を取得し、同期が正常であるかを判定する。
 */
type GetSyncStatusUseCase struct {
	sessionRepo port.SessionRepository
}

func NewGetSyncStatusUseCase(sessionRepo port.SessionRepository) *GetSyncStatusUseCase {
	return &GetSyncStatusUseCase{
		sessionRepo: sessionRepo,
	}
}

func (u *GetSyncStatusUseCase) Execute(ctx context.Context) (*domain.SyncStatus, error) {
	/* DBから最新の足、セッション、総件数を取得 */
	status, err := u.sessionRepo.GetSyncStatus(ctx)
	if err != nil {
		return nil, err
	}
	return status, nil
}
