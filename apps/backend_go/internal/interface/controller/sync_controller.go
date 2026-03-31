package controller

import (
	"gold-vola-bunseki/backend/internal/application/use_case"
	"net/http"

	"github.com/labstack/echo/v4"
)

/*
 * SyncController はデータ同期の状況を返すコントローラーです。
 * @responsibility: 同期ステータスのリクエストを受け付け、ユースケースを実行してJSONを返す。
 */
type SyncController struct {
	getSyncStatusUC *use_case.GetSyncStatusUseCase
}

func NewSyncController(getSyncStatusUC *use_case.GetSyncStatusUseCase) *SyncController {
	return &SyncController{
		getSyncStatusUC: getSyncStatusUC,
	}
}

func (c *SyncController) GetStatus(ctx echo.Context) error {
	/* ユースケースを実行して最新の同期情報を取得 */
	status, err := c.getSyncStatusUC.Execute(ctx.Request().Context())
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	/* 健康状態や日時情報を含めたJSONを返却 */
	return ctx.JSON(http.StatusOK, status)
}
