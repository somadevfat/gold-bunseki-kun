package test

import (
	"testing"
	"gold-vola-bunseki/backend/internal/domain"
)

func TestVolatility_CalculateValue(t *testing.T) {
	tests := []struct {
		name      string
		vola      domain.Volatility
		wantValue float64
		wantErr   bool
	}{
		{
			name: "正常: ボラティリティ計算 (2350 - 2300 = 50ドル幅)",
			vola: domain.Volatility{
				HighPrice: 2350.0,
				LowPrice:  2300.0,
			},
			wantValue: 50.0,
			wantErr:   false,
		},
		{
			name: "異常: 高値が安値を下回っている状態で計算しようとした場合",
			vola: domain.Volatility{
				HighPrice: 1900.0,
				LowPrice:  2000.0,
			},
			wantValue: 0.0,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.vola.CalculateValue()

			if (err != nil) != tt.wantErr {
				t.Errorf("CalculateValue() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && tt.vola.Value != tt.wantValue {
				t.Errorf("CalculateValue() expected value = %v, got %v", tt.wantValue, tt.vola.Value)
			}
		})
	}
}
