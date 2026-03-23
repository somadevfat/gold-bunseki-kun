package repository

import (
	"context"
	"time"

	"gold-vola-bunseki/api/internal/domain"
)

type ZigZagRepositoryImpl struct{}

func NewZigZagRepositoryImpl() *ZigZagRepositoryImpl {
	return &ZigZagRepositoryImpl{}
}

func (r *ZigZagRepositoryImpl) SavePoints(ctx context.Context, points []*domain.ZigZagPoint) error {
	// 今は本物のDBがないので、ダミー処理とします
	// ログを出しているふり
	return nil
}

func (r *ZigZagRepositoryImpl) FindByTimeWindow(ctx context.Context, start time.Time, end time.Time) ([]*domain.ZigZagPoint, error) {
	return nil, nil
}
