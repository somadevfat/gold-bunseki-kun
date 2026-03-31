package controller

import (
	"net/http"
	"gold-vola-bunseki/backend/internal/application/use_case"

	"github.com/labstack/echo/v4"
)

/*
 * ReplayController は、特定の指標に関する「前回事実」と「過去統計」をJSONで返すコントローラー。
 * @responsibility: ユーザーが選択した指標名に基づき、UseCaseを通じてチャートデータと統計値をパスする。
 */
type ReplayController struct {
	getReplayDataUC *use_case.GetReplayDataUseCase
}

func NewReplayController(uc *use_case.GetReplayDataUseCase) *ReplayController {
	return &ReplayController{getReplayDataUC: uc}
}

/*
 * GetEventReplay は指標名に基づいて再現データを取得します。
 * GET /api/market/replay?event=ISM製造業PMI
 */
func (ctrl *ReplayController) GetEventReplay(c echo.Context) error {
	eventName := c.QueryParam("event")
	if eventName == "" {
		// 指標名は必須
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "指標名(event)を指定してください"})
	}

	response, err := ctrl.getReplayDataUC.Execute(c.Request().Context(), eventName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "前回データと統計情報の取得に失敗しました"})
	}

	return c.JSON(http.StatusOK, response)
}
