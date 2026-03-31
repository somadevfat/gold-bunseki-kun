package controller

import (
	"net/http"
	"strconv"
	"gold-vola-bunseki/backend/internal/application/use_case"

	"github.com/labstack/echo/v4"
)

/*
 * SessionController はHTTP通信を受け、セッション（地合い）データをJSONで返すコントローラー。
 * @responsibility: エンドポイントに対するリクエスト（例: limit パラメータ）をパースし、UseCaseにパスする。
 */
type SessionController struct {
	fetchSessionsUC *use_case.FetchSessionsUseCase
}

func NewSessionController(uc *use_case.FetchSessionsUseCase) *SessionController {
	return &SessionController{fetchSessionsUC: uc}
}

/*
 * GetRecentSessions は直近のセッション別地合いデータを返すハンドラ。
 * GET /api/market/sessions
 */
func (ctrl *SessionController) GetRecentSessions(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	limit := 10 // デフォルト10件（直近数日分に相当）
	
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	response, err := ctrl.fetchSessionsUC.Execute(c.Request().Context(), limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "データベースから地合い情報の取得に失敗しました"})
	}

	return c.JSON(http.StatusOK, response)
}
