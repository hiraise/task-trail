package v1

import (
	"log/slog"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

func NewRouter(router *gin.Engine, u usecase.Registration, l *slog.Logger) {

	g := router.Group("/v1")
	NewRegistrationRouter(g, u, l)
}
