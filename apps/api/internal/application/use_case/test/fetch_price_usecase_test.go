package test

import (
	"context"
	"errors"
	"testing"

	"gold-vola-bunseki/api/internal/application/use_case"
	"gold-vola-bunseki/api/internal/domain"
)

/*
 * mockPriceRepository はテスト用に本物のリポジトリのフリをする「影武者」です。
 * @responsibility: 好きなデータを返したり、わざとエラーを起こしたりしてUseCaseを試す。
 */
type mockPriceRepository struct {
	price *domain.PriceRecord
	err   error
}

// Port (PriceRepository) の規約を満たすためにメソッドを定義
func (m *mockPriceRepository) FetchLatest(ctx context.Context) (*domain.PriceRecord, error) {
	return m.price, m.err
}

/*
 * TestFetchPriceUseCase_Execute はユースケースの決定ロジックをテストします。
 * @responsibility: リポジトリがどんな値を返そうとも、ユースケースが正しく検証し判断できるか網羅。
 */
func TestFetchPriceUseCase_Execute(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name      string
		mockPrice *domain.PriceRecord
		mockErr   error
		wantErr   bool
	}{
		// --- 正常系 ---
		{
			name: "正常: リポジトリから有効な価格が取れたらそのまま返す",
			mockPrice: &domain.PriceRecord{
				Open: 2300, High: 2310, Low: 2290, Close: 2305,
			},
			mockErr: nil,
			wantErr: false,
		},

		// --- 異常系 (インフラレベルのエラー) ---
		{
			name:      "異常: DBや外部APIとの通信に失敗した場合",
			mockPrice: nil,
			mockErr:   errors.New("network error"),
			wantErr:   true,
		},

		// --- 異常系 (ドメインルール違反) ---
		{
			name: "異常: 通信は成功したが、取れたデータがバリデーション違反（高安逆転）だった場合",
			mockPrice: &domain.PriceRecord{
				Open: 2300, High: 2200, Low: 2400, Close: 2300,
			},
			mockErr: nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 1. 偽物のリポジトリを準備
			mockRepo := &mockPriceRepository{
				price: tt.mockPrice,
				err:   tt.mockErr,
			}

			// 2. テスト対象のユースケースを初期化 (モックをDIで注入する！)
			uc := use_case.NewFetchPriceUseCase(mockRepo)

			// 3. 実行！
			got, err := uc.Execute(ctx)

			// 4. 検証
			if (err != nil) != tt.wantErr {
				t.Fatalf("Execute() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && got == nil {
				t.Error("Execute() expected result but got nil")
			}
		})
	}
}
