package controller

import (
	"net/http"

	"gold-vola-bunseki/backend/internal/application/use_case"
	"github.com/labstack/echo/v4"
)

type ZigZagController struct {
	useCase *use_case.CalculateZigZagUseCase
}

func NewZigZagController(uc *use_case.CalculateZigZagUseCase) *ZigZagController {
	return &ZigZagController{useCase: uc}
}

func (c *ZigZagController) Calculate(ctx echo.Context) error {
	points, err := c.useCase.Execute(ctx.Request().Context())
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"message": "ZigZag calculate success via Fast Python AI Engine",
		"points":  points,
	})
}
