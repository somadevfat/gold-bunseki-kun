package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * AnalyticsClient は Python (FastAPI) サーバーへの通信を行う実体です。
 * @responsibility: HTTP越しにPythonへデータを送り、ZigZagや分析結果を受け取る。
 */
type AnalyticsClient struct {
	baseURL string
	client  *http.Client
}

func NewAnalyticsClient(baseURL string) *AnalyticsClient {
	return &AnalyticsClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second}, // タイムアウトは10秒
	}
}

// 送信用JSONモデル
type reqPrice struct {
	Timestamp string  `json:"timestamp"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
}

type zigzagRequest struct {
	Prices    []reqPrice `json:"prices"`
	Threshold float64    `json:"threshold"`
}

// 受信用JSONモデル
type resPoint struct {
	Timestamp string  `json:"timestamp"`
	Price     float64 `json:"price"`
	Type      string  `json:"type"` // "HIGH" or "LOW"
}

type zigzagResponse struct {
	Points []resPoint `json:"points"`
}

func (c *AnalyticsClient) CalculateZigZag(ctx context.Context, prices []*domain.PriceRecord) ([]*domain.ZigZagPoint, error) {
	// 1. Pythonの型に合わせてリクエストを作成
	reqPayload := zigzagRequest{
		Prices:    make([]reqPrice, len(prices)),
		Threshold: 0.5,
	}
	for i, p := range prices {
		reqPayload.Prices[i] = reqPrice{
			Timestamp: p.Timestamp.Format(time.RFC3339),
			High:      p.High,
			Low:       p.Low,
		}
	}

	bodyBytes, _ := json.Marshal(reqPayload)
	req, _ := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/zigzag/calculate", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	// 2. Pythonへロケット発射（POST）
	res, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Python分析サーバーとの通信に失敗しました (起動していますか？): %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("Pythonからエラーが返りました (Status: %d, Body: %s)", res.StatusCode, string(body))
	}

	// 3. 受け取ったJSONをパース
	var resPayload zigzagResponse
	if err := json.NewDecoder(res.Body).Decode(&resPayload); err != nil {
		return nil, fmt.Errorf("JSONの変換に失敗しました: %w", err)
	}

	// 4. Goの「Domain型」に戻してUseCaseに返す（他層への汚染を防ぐため）
	var domainPoints []*domain.ZigZagPoint
	for _, rp := range resPayload.Points {
		parsedTime, _ := time.Parse(time.RFC3339, rp.Timestamp)
		ptype := domain.ZigZagTypeHigh
		if rp.Type == "LOW" {
			ptype = domain.ZigZagTypeLow
		}
		domainPoints = append(domainPoints, &domain.ZigZagPoint{
			Timestamp: parsedTime,
			Price:     rp.Price,
			Type:      ptype,
		})
	}

	return domainPoints, nil
}
