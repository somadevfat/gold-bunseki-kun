package test

import (
	"testing"
	"gold-vola-bunseki/api/internal/domain"
)

func TestPriceRecord_Validate(t *testing.T) {
	tests := []struct {
		name    string
		price   domain.PriceRecord
		wantErr bool
	}{
		{
			name: "正常なゴールド価格",
			price: domain.PriceRecord{
				Open: 2300, High: 2310, Low: 2290, Close: 2305,
			},
			wantErr: false,
		},
		{
			name: "異常: 高値が安値より低い",
			price: domain.PriceRecord{
				Open: 2300, High: 2200, Low: 2400, Close: 2300,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.price.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
